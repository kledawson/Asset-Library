import fs from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { seatRackHardware } from '../src/rackHardware.mjs';
const bytes=await fs.readFile('public/models/workshop-tool-rack-final.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
seatRackHardware(scene);
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
await fs.writeFile('.asset-candidates/workshop-tool-rack-seated.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
