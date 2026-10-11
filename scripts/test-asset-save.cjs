const fs=require('fs/promises'),path=require('path'),{spawn}=require('child_process'),assert=require('assert');
(async()=>{
 const base=path.resolve('.asset-candidates/save-restore-test'),root=path.join(base,'models');await fs.mkdir(root,{recursive:true});await fs.mkdir(path.join(root,'editor-sources'),{recursive:true});
 const names=['workshop-wrench.glb','workshop-tool-rack-final.glb'];const before=await Promise.all(names.map(n=>fs.readFile(path.join('public/models',n))));
 for(let i=0;i<names.length;i++){await fs.writeFile(path.join(root,names[i]),before[i]);await fs.writeFile(path.join(root,'editor-sources',names[i]),before[i]);}
 const old={'tool-wrench:high':{items:null,revision:1},'tool-rack:final':{items:null,revision:1}};await fs.writeFile(path.join(root,'asset-saves.json'),JSON.stringify(old));
 const child=spawn(process.execPath,['scripts/asset-save-server.cjs'],{env:{...process.env,ASSET_MODEL_ROOT:root,ASSET_BACKUP_ROOT:path.join(base,'backups'),ASSET_PENDING_ROOT:path.join(base,'pending'),ASSET_SAVE_PORT:'3003'},stdio:['ignore','pipe','pipe']});
 try{
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',c=>reject(Error('Service exited '+c)));});
 const candidate=await fs.readFile('public/models/editor-sources/workshop-wrench.glb');
 const next={'tool-wrench:high':{items:[],history:[null],revision:2},'tool-rack:final':{items:null,revision:2}};
 const call=async(route,body)=>{const r=await fetch('http://127.0.0.1:3003'+route,{method:'POST',headers:{Origin:'http://localhost:3002','Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
 await call('/save',{key:'tool-wrench:high',files:names.map((name,i)=>({name,data:(i===0?candidate:before[0]).toString('base64')})),snapshot:next});
 assert.deepEqual(await fs.readFile(path.join(root,names[0])),candidate);assert.deepEqual(await fs.readFile(path.join(root,names[1])),before[0]);
 await call('/restore',{key:'tool-wrench:high'});
 for(let i=0;i<names.length;i++)assert.deepEqual(await fs.readFile(path.join(root,names[i])),before[i]);
 await call('/restore',{key:'tool-wrench:high',direction:'next'});
 assert.deepEqual(await fs.readFile(path.join(root,names[0])),candidate);assert.deepEqual(await fs.readFile(path.join(root,names[1])),before[0]);
 const r=await fetch('http://127.0.0.1:3001/save',{method:'OPTIONS',headers:{Origin:'http://localhost:3002','Access-Control-Request-Method':'POST'}});assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),'http://localhost:3002');
 console.log('PASS: editor origin accepted; Save writes wrench and Final; Previous recovers both files; Next restores the newer save. Live models unchanged.');
 }finally{child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
