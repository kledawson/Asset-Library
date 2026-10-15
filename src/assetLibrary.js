// Add future assets and their versions here; the comparison UI is shared.
export const assetLibrary = [{
  id: 'tool-rack', name: 'Workshop Tool Rack',
  versions: [
    { id: 'light', label: 'Light', details: '359 KB · 10,702 triangles', url: '/models/editor-sources/workshop-tool-rack-light.glb' },
    { id: 'medium', label: 'Medium', details: '798 KB · 34,322 triangles', url: '/models/editor-sources/workshop-tool-rack-medium.glb' },
    { id: 'high', label: 'High', details: 'Earliest retained High backup; not the original one-prompt file', url: '/models/editor-sources/workshop-tool-rack-high.glb' },
    { id: 'final', label: 'Final', details: 'Current refined version · individual saves update this model', url: '/models/editor-sources/workshop-tool-rack-final.glb' },
  ],
}, ...[
  ['wrench', 'Wrench', 'Forged steel combination wrench with a circular box end.'],
  ['cog', 'Brass Cog', 'Machined twelve tooth brass cog with bored face and stepped hub.'],
  ['hammer', 'Hammer', 'Steel claw hammer with a curved peen and hickory handle.'],
  ['screwdriver', 'Screwdriver', 'Teal handle above a steel shaft and flat driver tip.'],
  ['triangle', 'Measuring Triangle', 'Brass triangular measuring rule with graduations on both faces.'],
  ['plant', 'Potted Plant', 'Leafy workshop plant in a terracotta pot; ready for the drop test.'],
  ['pencil', 'Pencil', 'Yellow pencil with a sharpened tip and eraser.'],
  ['notebook', 'Notebook', 'Spiral notebook with centered paper and a blue cover.'],
].map(([id, name, description]) => ({
  id: `tool-${id}`, name, description,
  versions: [{ id: 'high', label: 'High', details: description, url: `/models/editor-sources/workshop-${id}.glb${id === 'plant' ? '?v=leaf-edit-1' : ''}` }],
}))];

assetLibrary.push({id:'play-props',name:'Play Prop Set',kind:'assembly',noAll:true,versions:[
  {id:'default',label:'Loose',details:'A playful, loosely arranged set of every prop.',url:'/models/editor-sources/play-props.glb'},
  {id:'organized',label:'Organized',details:'Every prop lined up for a closer look.',url:'/models/editor-sources/play-props-organized.glb'},
]}, ...[
  ['ramp','Wooden Ramp'],['parcel-large','Large Parcel'],['parcel-small','Small Parcel'],['cube','Decorated Cube'],['coral-block','Timber Block'],['orange-block','Chunky Block'],['wedge','Wedge'],['ball','Play Ball'],
].map(([id,name])=>({id:'play-'+id,name,kind:'individual',versions:[{id:'default',label:'Default',details:'Play Props · approved model',url:`/models/editor-sources/play-${id}.glb`}]})));

for(const size of ['small','large'])assetLibrary.find(asset=>asset.id===`play-parcel-${size}`).versions=['coral','yellow','teal'].map(color=>({id:color,label:color[0].toUpperCase()+color.slice(1),details:`${color} wrap · ${{coral:'square',yellow:'circle',teal:'triangle'}[color]} label`,url:`/models/editor-sources/play-parcel-${size}-${color}.glb`}));
for(const id of ['coral-block','orange-block','wedge','ball'])assetLibrary.find(asset=>asset.id===`play-${id}`).versions=(id==='orange-block'?['coral','orange','teal']:['coral','yellow','teal']).map(color=>({id:color,label:color[0].toUpperCase()+color.slice(1),details:`${color} Play Prop`,url:`/models/editor-sources/play-${id}-${color}.glb`}));

// Register another package with its asset IDs; assets keep their own versions.
export const assetPackages = [{
  id: 'workshop-tool-rack', name: 'Workshop Tool Rack',
  assetIds: ['tool-rack', 'tool-screwdriver', 'tool-wrench', 'tool-cog', 'tool-triangle', 'tool-hammer', 'tool-plant', 'tool-pencil', 'tool-notebook'],
}, {id:'play-props',name:'Play Props',assetIds:['play-props','play-ramp','play-parcel-large','play-parcel-small','play-cube','play-coral-block','play-orange-block','play-wedge','play-ball']}];

export const isIndividualAsset = id => assetLibrary.find(asset=>asset.id===id)?.kind==='individual' || (id.startsWith('tool-') && id!=='tool-rack');
