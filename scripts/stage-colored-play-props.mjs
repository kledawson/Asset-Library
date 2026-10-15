import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import rules from '../src/assetModelRules.js';
for(const id of (process.argv.includes('--chunky-only')?['orange-block']:['coral-block','orange-block','wedge','ball']))for(const color of rules.colorVersions[id]){
  const name=`play-${id}-${color}.glb`,candidate=path.resolve('.asset-candidates/play-props/color-variants/'+name);
  // New keys start from the retained original prop; stage revisions before Save Model.
  for(const folder of ['','editor-sources/']){const target='public/models/'+folder+name;if(!(await fs.stat(target).catch(()=>null)))await fs.copyFile('public/models/'+folder+`play-${id}.glb`,target);}
  execFileSync(process.execPath,['scripts/stage-asset.cjs',`play-${id}:${color}`,candidate]);console.log('Staged '+name);
}
