# Asset Workshop

The main workshop links to `/?assets=1`. The older `/?asset=tool-rack` link also opens the library.

Keep this library as the shared preview for future assets. Register assets and their versions in `src/assetLibrary.js`; do not make a separate comparison app per asset.

The requested comparison controls are Light, Medium, High, and All three. Each preview has independent camera orbit, zoom and pan, consistent lighting, automatic framing, and its own download. Reset views restores framing. Rendering pauses while idle.

Open GLB previews a local file without uploading it. It is temporary and does not register the file permanently; add a finished asset to the catalog to keep it available.

On narrower screens comparisons stack vertically. Save screenshots after meaningful visual updates.

## Viewer layout preference
Use one full-screen camera view with a compact draggable panel starting at the top left. Keep the catalog, file opener, and Light / Medium / High / All three controls in that panel. Avoid separate boxed preview canvases. In the combined view, the arrows under each model rotate that model independently; dragging the background orbits the shared camera.
`nRotation controls: both individual and All views show the floating label and rotation arrows. Drag the teal ground ring to rotate only that asset about its vertical axis; the shared camera is disabled during ring dragging. Mouse-wheel scrolling zooms the camera. The combined-view button is named All.
Rotation rings are flat translucent gray annuli at floor level, sized from each model footprint. No raised torus or yellow marker. Hide labels / Show labels in the top panel toggles floating rotation labels for individual and All views; rings stay usable.
Viewer organization: Asset library starts top left; Viewer tools starts top right and contains Back to workshop, Open GLB, Reset, Hide/Show labels, and the selected model download. Both panes drag by their header and collapse with the minus/plus button. Rotation rings use progressively darker gray for idle, hover, and dragging.
## Viewer Controls layout
Navigation is a standalone Back to workshop button at the top right. The compact Preview Settings pane holds Open GLB, Reset view, Hide/Show labels, and the selected model's download. It uses a two-column button grid and remains collapsible and draggable.

## Separated tool props
The High model generator also exports individual `workshop-wrench.glb`, `workshop-cog.glb`, `workshop-hammer.glb`, and `workshop-screwdriver.glb` props. They are listed as selectable assets in the library, with the same full-screen camera, ring rotation, and controls. Keep these separate objects for future knock-off physics; keep the complete rack model as the lightweight static scene asset.
Individual wrench, cog, and hammer entries are extracted from the High rack model and can be inspected as independent assets. Their Preview Settings include a Drop test / Reset prop control using Rapier rigid-body physics on a floor. This previews the individual prop physics; collisions with the driving car and a shaking in-world rack are a later integration step.
