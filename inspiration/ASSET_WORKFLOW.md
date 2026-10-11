# First custom asset: workshop tool rack

Reference: `pocket-workshop-loop-study.png`, foreground tool rack. This is a hand-built procedural 3D approximation from a single image, not a recovered original model. Hidden sides, dimensions and construction are inferred.

Deliverables:
- `public/models/workshop-tool-rack.glb`: independent 3D model, approximately 359 KB, 10,702 triangles, 14 merged material meshes, no texture downloads.
- `scripts/create-tool-rack.mjs`: editable modeling recipe. Run `node scripts/create-tool-rack.mjs` from the project root to regenerate the model.
- `src/WorkshopToolRack.jsx`: reusable component loading the GLB.
- `http://localhost:3000/?asset=tool-rack`: orbit/zoom preview and model download.

Modeled details: rounded timber frame, seven board planks, peg holes, fasteners, cream wrench, gold gear and triangle ruler, slate hammer with coral handle, teal tool, three drawers, handles, small tray and terracotta plants. Colors are explicitly converted to linear space for glTF export. Wood grain and sculpted wear are not modeled yet. This model can be imported into Blender later without changing the website's asset format.

## Keep the world expandable

The current project content already lives in a list in `src/portfolioContent.js`. Five reserved bays give room for more projects. To add one, assign a free bay angle to the new project and remove that angle from the future-bay list so they do not overlap.

Before changing the island's overall dimensions, consolidate its existing hardcoded radii into a single world configuration: island radius, road inner/outer radii, project ring radius, station footprint and camera framing. Derive barrier/lamp/road/station positions and project proximity ranges from that configuration. This is a future refactor, not something already implemented by this asset prototype.

Use each station's local coordinate system: asset geometry around a stable origin, with placement and rotation owned by the station. Keep the car's scale and physics settings independent of decorative world size. Use simple separate collision shapes for finished assets rather than testing every bolt and leaf. Reuse models/materials, and add more space or another region when bays become crowded rather than continually shrinking objects.

## Asset creation options

No Blender connection is needed for this workflow: Codex builds geometry/materials in code and exports GLB. Blender is useful for sculpting organic shapes, painting texture detail, or artist cleanup later. Its free tools can also be scripted when available, but access to a local installation is separate from an app connection. A good concept render does not guarantee an exact automatic 3D reconstruction; review one finished prop before committing to a whole world.
