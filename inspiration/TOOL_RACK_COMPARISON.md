# Tool rack variants

- Light: the original GLB preserved under `public/models/workshop-tool-rack-light.glb`. Generator: `scripts/create-tool-rack-light.mjs`. 358,940 bytes, 10,702 triangles, 14 material meshes.
- Medium: revised model with finer bevels, modeled timber grain and knots, corner plates, curved tool hooks, gear bushing, wrench and handle details, bail drawer pulls and pot/branch details. `public/models/workshop-tool-rack-medium.glb`. Generator: `scripts/create-tool-rack-medium.mjs`. 797,608 bytes, 34,322 triangles, 16 material meshes.

Both use the same proportions, palette and comparison lighting. Open `http://localhost:3000/?asset=tool-rack` to switch versions without changing the camera or view them side by side. The workshop continues displaying Light until a version is chosen.

These are iteration labels requested by the owner, not a controlled model benchmark: Medium was refined using the existing asset and feedback. The difference in detail also increases geometry and download size. No driving settings were changed.

The older asset workflow document refers to the original unsuffixed filename. Use the suffixed files and generators above instead.
# High refinement — 2026-10-10

- File: `public/models/workshop-tool-rack-high.glb`
- Recipe: `scripts/create-tool-rack-high.mjs`, copied from Medium.
- Size: 1,417,768 bytes; 47,324 triangles; 20 material meshes.
- Reference: `pocket-workshop-loop-study.png`, foreground tool rack.
- Rounded steel combination wrench with a twelve-point box end and recessed handle.
- Twelve-tooth brass cog with six lightening holes, a stepped bronze hub, and a keyway.
- Forged cross-peen hammer with a polished striking face, shaped timber handle, and coral grip seams.
- Preview now includes Light, Medium, High, and Medium vs High. The main workshop still uses Light.
- Higher subdivision is limited to the tool shapes; all geometry is merged by material. No image textures or external paid services.
- These are successive refinements, not a controlled comparison of model reasoning levels.

