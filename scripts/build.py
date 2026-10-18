from pathlib import Path
import json,hashlib,zipfile
ROOT=Path(__file__).resolve().parents[1]
docs=ROOT/'docs'
lessons=json.loads((ROOT/'content-original.json').read_text())
bc=json.loads((ROOT/'content-bc.json').read_text())
audio=json.loads((ROOT/'audio-manifest.json').read_text()) if (ROOT/'audio-manifest.json').exists() else []
for lesson in lessons:
    full=next((a for a in audio if a['path']==f"audio/{lesson['id']}-full.mp3"),None)
    lesson['duration']=round(full['duration'],2) if full else round(len(' '.join(s['en'] for s in lesson['segments']).split())/2.5)
    lesson['voice']='en-GB-RyanNeural'
(docs/'content.js').write_text('window.LISTEN_CONTENT='+json.dumps({'lessons':lessons,'britishCouncil':bc},ensure_ascii=False,separators=(',',':'))+';\n')
(docs/'.nojekyll').touch()
files=['./']+[str(p.relative_to(docs)) for p in sorted(docs.rglob('*')) if p.is_file() and p.name not in ['precache.json','sw.js','.DS_Store']]
(docs/'precache.json').write_text(json.dumps({'version':'1.0','files':files},ensure_ascii=False,separators=(',',':')))
print(json.dumps({'lessons':len(lessons),'bc':len(bc),'audio':len(audio),'offlineFiles':len(files),'bytes':sum(p.stat().st_size for p in docs.rglob('*') if p.is_file())}))
