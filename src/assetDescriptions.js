const descriptions = {
  'pocket-post': 'A little postal corner, ready for the next delivery.',
  'mail-mailbox': 'An arched parcel mailbox with a low loading flap.',
  'mail-hand-truck': 'A teal mail trolley with coral grips and sturdy wheels.',
  'mail-scale': 'A wooden weighing platform above a cream dial.',
  'mail-tape-dispenser': 'A coral dispenser with a cream packing-tape roll.',
  'mail-sack': 'An open cloth sack with a folded rim and a soft drop response.',
  'mail-dispatch-bin': 'An open sorting bin with a low loading edge and postal markings.',
  'tool-wrench': 'A steel wrench with a subtle stamped detail.',
  'tool-cog': 'A brass cog with warm bronze accents.',
  'tool-hammer': 'A steel hammer with a cushioned grip.',
  'tool-screwdriver': 'A teal-handled screwdriver with a steel tip.',
  'tool-triangle': 'A golden triangle with raised ruler marks.',
  'tool-plant': 'A leafy green plant in a terracotta pot.',
  'tool-pencil': 'A yellow pencil with green lettering.',
  'tool-notebook': 'A spiral notebook with a blue cover.',
  'play-props': 'A playful set of blocks, parcels, and props.',
  'play-ramp': 'A wooden ramp with a gentle slope.',
  'play-cube': 'A little wooden cube full of colorful fun.',
  'play-coral-block': 'A coral block with softly rounded edges.',
  'play-orange-block': 'An orange block with softly rounded edges.',
  'play-wedge': 'A teal wooden wedge with a sloping face.',
  'play-ball': 'A sunny yellow ball with a subtle seam.',
};
const rackDescriptions = {
  light: 'A simple wooden rack with workshop tools.',
  medium: 'A fuller wooden rack with workshop tools.',
  high: 'A detailed wooden rack with workshop tools.',
  final: 'A refined rack of tools, drawers, and plants.',
  all: 'Four workshop rack versions side by side.',
};

export function assetDescription(asset, variant) {
  if (asset.id === 'pocket-post' && variant === 'organized') return 'Six postal props, lined up for a closer look.';
  if (asset.id === 'tool-rack') return rackDescriptions[variant] || rackDescriptions.final;
  if (asset.id === 'play-props' && variant === 'organized') return 'Every play prop lined up for a closer look.';
  if (asset.id.startsWith('play-parcel-')) {
    const size = asset.id.endsWith('small') ? 'Small' : 'Large';
    const color = variant === 'all' ? 'all' : asset.versions.find(version => version.id === variant)?.id || asset.versions[0].id;
    if (color === 'all') return `Three ${size.toLowerCase()} parcels in coral, yellow, and teal.`;
    if (size === 'Large') return `A roomy parcel with twin ${color} bands.`;
    const shape = { coral: 'square', yellow: 'circle', teal: 'triangle' }[color];
    return `${size} parcel, ${color} wrap, and a ${shape} label.`;
  }
  const coloredProps={'play-coral-block':'timber block','play-orange-block':'chunky block','play-wedge':'wedge','play-ball':'ball'};
  if(coloredProps[asset.id]){
    const noun=coloredProps[asset.id];
    if(variant==='all')return `Three colorful ${noun}s, ready to play.`;
    const color=asset.versions.find(item=>item.id===variant)?.id||asset.versions[0].id;
    return noun==='chunky block'?`A ${color} chunky block topped with warm wood.`:noun.includes('block')?`A ${color} ${noun} with warm wooden ends.`:noun==='ball'?`A ${color} ball, ready for a little roll.`:`A ${color} wedge with a playful slope.`;
  }
  return descriptions[asset.id] || 'Your imported model, ready to explore.';
}
