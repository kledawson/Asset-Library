const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','build','coverage','.npm-cache','assemble-library.cjs','FILES.json'].includes(item.name))continue;const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else{const b=fs.readFileSync(file);files.push({path:path.relative(root,file).split(path.sep).join('/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}}}
walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(path.join(root,'docs/FILES.json'),JSON.stringify({capturedAt:new Date().toISOString(),files},null,2)+'\n');
console.log(files.length+' files; '+files.reduce((sum,file)=>sum+file.bytes,0)+' bytes.');
