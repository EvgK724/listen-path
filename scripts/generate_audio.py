#!/usr/bin/env python3
"""Synthesize the app's original lesson text with the one approved Ryan voice.

Run in a Python environment with edge-tts and mutagen installed:
python3 scripts/generate_audio.py

British Council media is not read, downloaded, synthesized or modified here.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import wave

import edge_tts
from mutagen.mp3 import MP3


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "content-original.json"
MANIFEST = ROOT / "audio-manifest.json"
AUDIO_DIR = ROOT / "docs" / "audio"
VOICE = "en-GB-RyanNeural"
RATE = "+0%"
CONCURRENCY = 4
ATTEMPTS = 4
RETRY_DELAYS = (2, 5, 10)
AFCONVERT = shutil.which("afconvert")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def make_jobs(lessons: list[dict]) -> list[dict]:
    jobs = []
    for lesson in lessons:
        lesson_id = lesson["id"]
        segments = lesson["segments"]
        if not lesson_id.startswith("l") or not lesson_id[1:].isdigit():
            raise ValueError(f"Unexpected lesson id: {lesson_id}")
        texts = [segment["en"] for segment in segments]
        if not all(isinstance(text, str) and text.strip() for text in texts):
            raise ValueError(f"Missing English segment in {lesson_id}")
        # Preserve every English string exactly. One synthesis gives the full
        # monologue natural continuity; separate tracks support close listening.
        jobs.append({
            "path": f"audio/{lesson_id}-full.mp3",
            "lessonId": lesson_id,
            "segment": None,
            "text": " ".join(texts),
        })
        for index, text in enumerate(texts):
            jobs.append({
                "path": f"audio/{lesson_id}-{index + 1:02d}.mp3",
                "lessonId": lesson_id,
                "segment": index,
                "text": text,
            })
    for job in jobs:
        job["textSha256"] = sha256_bytes(job["text"].encode("utf-8"))
    if len({job["path"] for job in jobs}) != len(jobs):
        raise ValueError("Duplicate audio path")
    return jobs


def validate_audio(path: Path, *, decode: bool = True) -> tuple[float, int, str]:
    size = path.stat().st_size
    if size < 1024:
        raise ValueError(f"Audio file is too small: {path.name}")
    parsed = MP3(path)
    duration = float(parsed.info.length)
    if duration < 0.35 or parsed.info.sample_rate <= 0:
        raise ValueError(f"Invalid MP3 duration or sample rate: {path.name}")
    if decode:
        if not AFCONVERT:
            raise RuntimeError("afconvert is required for a complete decode check")
        with tempfile.TemporaryDirectory(prefix="listen-path-decode-", dir=ROOT) as folder:
            wav_path = Path(folder) / "decoded.wav"
            subprocess.run(
                [AFCONVERT, "-f", "WAVE", "-d", "LEI16", str(path), str(wav_path)],
                check=True,
                capture_output=True,
                timeout=40,
            )
            with wave.open(str(wav_path), "rb") as wav:
                frames = wav.getnframes()
                decoded_duration = frames / wav.getframerate()
                if frames <= 0 or abs(decoded_duration - duration) > 0.8:
                    raise ValueError(f"Unexpected decoded length: {path.name}")
                pcm = wav.readframes(frames)
                if not pcm or not any(pcm):
                    raise ValueError(f"Decoded audio is empty or silent: {path.name}")
    return duration, size, sha256_bytes(path.read_bytes())


def atomic_manifest(records: dict[str, dict], jobs: list[dict]) -> None:
    ordered = [records[job["path"]] for job in jobs if job["path"] in records]
    temporary = MANIFEST.with_suffix(".json.part")
    temporary.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n")
    os.replace(temporary, MANIFEST)


async def main() -> int:
    lessons = json.loads(SOURCE.read_text())
    jobs = make_jobs(lessons)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    existing = {}
    if MANIFEST.exists():
        existing = {record["path"]: record for record in json.loads(MANIFEST.read_text())}
    records = {}
    semaphore = asyncio.Semaphore(CONCURRENCY)
    progress_lock = asyncio.Lock()
    completed = 0
    resumed = 0
    failures = []

    print(f"Generating {len(jobs)} tracks from {len(lessons)} lessons; voice={VOICE}; rate={RATE}; concurrency={CONCURRENCY}", flush=True)

    async def run_job(job: dict) -> None:
        nonlocal completed, resumed
        async with semaphore:
            target = ROOT / "docs" / job["path"]
            part = target.with_suffix(".mp3.part")
            old = existing.get(job["path"])
            if old and old.get("voice") == VOICE and old.get("textSha256") == job["textSha256"] and target.exists():
                try:
                    duration, size, digest = await asyncio.to_thread(validate_audio, target)
                    if digest != old.get("sha256"):
                        raise ValueError("Existing hash mismatch")
                    records[job["path"]] = old
                    resumed += 1
                    async with progress_lock:
                        completed += 1
                        if completed % 12 == 0 or completed == len(jobs):
                            print(f"[{completed}/{len(jobs)}] validated (resumed {resumed})", flush=True)
                    return
                except Exception:
                    pass

            for attempt in range(1, ATTEMPTS + 1):
                try:
                    if part.exists():
                        part.unlink()
                    speech = edge_tts.Communicate(
                        job["text"],
                        voice=VOICE,
                        rate=RATE,
                        connect_timeout=20,
                        receive_timeout=60,
                    )
                    await asyncio.wait_for(speech.save(str(part)), timeout=150)
                    duration, size, digest = await asyncio.to_thread(validate_audio, part)
                    os.replace(part, target)
                    record = {
                        "path": job["path"],
                        "lessonId": job["lessonId"],
                        "segment": job["segment"],
                        "voice": VOICE,
                        "duration": round(duration, 3),
                        "bytes": size,
                        "sha256": digest,
                        "textSha256": job["textSha256"],
                    }
                    async with progress_lock:
                        records[job["path"]] = record
                        atomic_manifest(records, jobs)
                        completed += 1
                        if completed % 12 == 0 or completed == len(jobs):
                            print(f"[{completed}/{len(jobs)}] validated; latest {target.name}", flush=True)
                    return
                except Exception as error:
                    if part.exists():
                        part.unlink()
                    kind = type(error).__name__
                    if attempt == ATTEMPTS:
                        failures.append({"path": job["path"], "error": kind})
                        print(f"FAILED {target.name} after {ATTEMPTS} attempts: {kind}", flush=True)
                        return
                    delay = RETRY_DELAYS[attempt - 1]
                    print(f"Retry {attempt}/{ATTEMPTS - 1} for {target.name}: {kind}; backoff {delay}s", flush=True)
                    await asyncio.sleep(delay)

    await asyncio.gather(*(run_job(job) for job in jobs))
    current_jobs = make_jobs(json.loads(SOURCE.read_text()))
    if [(j["path"], j["textSha256"]) for j in current_jobs] != [(j["path"], j["textSha256"]) for j in jobs]:
        raise RuntimeError("Original English text changed during synthesis; rerun against final source")
    atomic_manifest(records, jobs)
    if failures:
        print(json.dumps({"complete": completed, "expected": len(jobs), "failures": failures}), flush=True)
        return 1
    if len(records) != len(jobs):
        raise RuntimeError("Incomplete manifest")
    monologues = [record for record in records.values() if record["segment"] is None]
    print(json.dumps({
        "status": "complete",
        "tracks": len(records),
        "fullTracks": len(monologues),
        "sentenceTracks": len(records) - len(monologues),
        "fullDurationSeconds": round(sum(record["duration"] for record in monologues), 3),
        "allBytes": sum(record["bytes"] for record in records.values()),
        "resumed": resumed,
        "voice": VOICE,
        "manifest": str(MANIFEST),
    }), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
