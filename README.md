# Listen Path

Personal English listening practice from B1 to B2. Static installable web app, Russian interface.

Published at https://evgk724.github.io/listen-path/

18 original short lessons and 144 synthetic Microsoft Ryan (en-GB-RyanNeural) recordings: 18 complete tracks plus 126 sentence tracks. Gist, detail, optional dictation, hidden transcript, repetition with a pause, playback speed, A/B loops, retelling, and spaced phrase review. No grades or invented progress.

12 British Council LearnEnglish lesson references open the complete official source page. British Council audio, transcripts, exercises and branding are not copied or republished. The independent personal-audio importer accepts the user's own or licensed recordings. Uploaded audio stays in IndexedDB on the device and is never sent to a server.

Progress and notes use localStorage. JSON export/import merges newer records; audio blobs are not in the export. Clearing site data removes local progress and personal audio. Separate browsers and Home Screen installations may use separate storage. No accounts, analytics, or cloud synchronization.

Offline preparation stores the entire original course, including every audio file. The service worker handles MP3 byte ranges for Safari. Official external pages require internet. A visible ready indicator appears only after the complete precache inventory is present.

## Build

Run `python3 scripts/build.py`, then `node scripts/verify.cjs --audio`. Content source: `content-original.json` and `content-bc.json`. Audio generation: `scripts/generate_audio.py` with edge-tts and mutagen. Voice is explicitly synthetic; fictional clinical/work scenarios provide language practice, not medical guidance.

GitHub Pages publishes `docs/` on the `codex/listen-path` branch. Bump the cache version in `docs/sw.js` when app or content changes. Test actual playback, offline reload, byte ranges, state persistence and sequential interaction in Chromium and WebKit before publishing.

All application code and original course content are included. Third-party referenced materials remain subject to their owners' terms: https://www.britishcouncil.org/terms .
