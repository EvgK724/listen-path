// Run from the private source checkout. Never put the access file in a repository.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]),privateDir=path.resolve(process.argv[3]);
if(!process.argv[2]||!process.argv[3])throw Error('Usage: node scripts/build_private.cjs output-directory private-access-directory');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(privateDir,{recursive:true,mode:0o700});
const keyFile=path.join(privateDir,'listen-path-key.json');let key;
if(fs.existsSync(keyFile))key=Buffer.from(JSON.parse(fs.readFileSync(keyFile)).key,'base64url');else{key=crypto.randomBytes(32);fs.writeFileSync(keyFile,JSON.stringify({key:key.toString('base64url')}),{mode:0o600});}
if(key.length!==32)throw Error('Invalid key file');
const raw=fs.readFileSync(path.join(root,'docs/content.js'),'utf8');const content=JSON.parse(raw.slice('window.LISTEN_CONTENT='.length).trim().replace(/;$/,''));
const payload={format:'listen-path-package/v1',content,css:fs.readFileSync(path.join(root,'docs/style.css'),'utf8'),scripts:{},audio:{}};
for(const name of ['engine.js','app.js'])payload.scripts[name]=fs.readFileSync(path.join(root,'docs',name),'utf8');
for(const f of fs.readdirSync(path.join(root,'docs/audio')).filter(f=>f.endsWith('.mp3')))payload.audio['audio/'+f]={type:'audio/mpeg',data:fs.readFileSync(path.join(root,'docs/audio',f)).toString('base64')};
const plain=Buffer.from(JSON.stringify(payload)),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
fs.writeFileSync(path.join(out,'course.enc'),Buffer.concat([iv,encrypted,cipher.getAuthTag()]));
let html=fs.readFileSync(path.join(root,'docs/index.html'),'utf8').replace('<html lang="ru">','<html lang="ru" data-locked="true">').replace('<meta name="theme-color"','<meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><meta name="theme-color"');
html=html.replace('href="style.css"','href="boot.css"').replace(/<script defer src="(?:content|engine|app)\.js"><\/script>/g,'').replace('<script defer src="offline.js">','<script defer src="boot.js"></script><script defer src="offline.js">');fs.writeFileSync(path.join(out,'index.html'),html);
fs.copyFileSync(path.join(root,'scripts/private-boot.js'),path.join(out,'boot.js'));fs.copyFileSync(path.join(root,'scripts/private-boot.css'),path.join(out,'boot.css'));fs.copyFileSync(path.join(root,'docs/offline.js'),path.join(out,'offline.js'));fs.copyFileSync(path.join(root,'docs/manifest.webmanifest'),path.join(out,'manifest.webmanifest'));
fs.mkdirSync(path.join(out,'assets'),{recursive:true});for(const f of ['icon.svg','icon-180.png','icon-192.png','icon-512.png'])fs.copyFileSync(path.join(root,'docs/assets',f),path.join(out,'assets',f));fs.writeFileSync(path.join(out,'.nojekyll'),'');
const files=['./','index.html','boot.js','boot.css','offline.js','manifest.webmanifest','course.enc','assets/icon.svg','assets/icon-180.png','assets/icon-192.png','assets/icon-512.png'];fs.writeFileSync(path.join(out,'precache.json'),JSON.stringify({files}));
const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'course.enc'))).digest('hex').slice(0,12);let sw=fs.readFileSync(path.join(root,'docs/sw.js'),'utf8');sw=sw.replace(/const VERSION='[^']+',CORE=\[[^;]+;/,'const VERSION=\'listen-path-v1-private-'+hash+'\',CORE='+JSON.stringify([...files,'precache.json'])+';');fs.writeFileSync(path.join(out,'sw.js'),sw);
fs.writeFileSync(path.join(out,'README.md'),'# Listen Path encrypted delivery\n\nApplication materials are AES-256-GCM encrypted. The key is supplied only by the private access link fragment and is not stored here. Original source is in the owner\'s private repository. No personal data, keys or authentication tokens belong in this deployment.\n');
fs.writeFileSync(path.join(privateDir,'build-audit.json'),JSON.stringify({encryptedBytes:fs.statSync(path.join(out,'course.enc')).size,lessons:content.lessons.length,audio:Object.keys(payload.audio).length,privateKeyOutsideRepo:!keyFile.startsWith(out),cipherSHA256:hash}));
console.log(JSON.stringify({encryptedBytes:fs.statSync(path.join(out,'course.enc')).size,lessons:content.lessons.length,audio:Object.keys(payload.audio).length,keySavedOutsideRepository:true}));
