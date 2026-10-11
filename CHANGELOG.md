# Changelog

## 1.0.0 — October 11, 2026

Capture: **2026-10-11T13:13:45.930Z / October 11, 6:13:45 am PDT**.
Session scope: **October 10, 2026, 2 pm PDT through capture**. This records changes, including superseded experiments; not every historical variation is active.

### Library and editor

- Light, Medium, High, Final, All comparisons; eight individual asset entries.
- Package/asset/version browser, full-screen preview, draggable/collapsible panels, persistent UI state, labels, GLB inspection, reset view, rotation controls.
- Preloading and persistent canvas reduce switching blank time; independent asset application.
- Whole Item / Element buttons, teal/orange highlighting, move/rotate/resize, precise adjustments, duplicate/remove/reset, undo/redo, copy/paste, natural names and filtering.
- Outside-click deselection, read-only All view, double-click navigation, 200 ms selection delay; popup removed; instructions inside shortcuts.
- Triangle body, labels and ticks grouped; 212 parts verified together.
- Real GLB saving, source-preserving candidate staging, draft/original comparison, backups, previous/next save.
- Individual saves update Final only; explicit pencil saves synchronize even when unchanged.

### Camera and physics

- Standard camera, orientation, zoom, ring radius, reset center and drop height; triangle exception removed.
- Drop teleports up before falling; Reset returns to the suspended preview position and freezes until Drop.
- Increased drop height and zoomed out; randomized tilt/spin restored and moderated; bounce reduced.
- Fixed missing teleport, immediate falling after Reset, collider crash, floor clipping, ring pivot and changing camera/ring size.

### Rack

- Preserved textured wood, rounded edges, original light wood border restored.
- Cabinet contrast improved; original yellow handle shapes restored.
- Seated steel corner fasteners replace floating black plates; hook mounts adjusted.
- Hooks made independently draggable, tube ends capped; cog hook extended on blue axis; two hammer and two triangle hooks.
- Raised brown dots arranged two columns per wooden board; notebook and pencil replace clutter.

### Individual artwork

- Hammer: refined claw, slot, proportions, steel and wood details; salmon padding with dark brown fine lines; legacy embedded lines removed; individual/Final synchronized.
- Screwdriver: solid handle, cap and fitted rings; refined crossed tip and shaft; hanging orientation corrected.
- Wrench: rounded form, solid inner walls, seated accents, moderate grey contrast and small 12 stamp.
- Cog: gold brass with darker bronze rings; irregular brushed texture and controlled reflections; preferred color restored. Silver/reddish copper rejected, excessive shine/streak size reduced. Global lighting experiment reverted.
- Triangle: clearer small numbers on major ticks, corner spacing corrected, 15 restored, vertical numbers removed, slightly raised marks.
- Plants: leaf spacing and angles refined, standalone asset linked, natural leaf names.
- Notebook: ruling and spiral direction changed; paper outline and X centering corrected; spiral tips tucked; independent upright preview, negative X upward.
- Pencil: standalone upright asset; hard hexagonal shaft, round collar/eraser, softer red, lighter grey collar, two grooves, cleaner proportions and tip.
- Pencil lettering: DL evolved to #2/DL and smaller italic Dawson Le; dark green slight sheen, upward facing on rack. Trademark replaced with copyright: Dawson Le ©.

### Bugs addressed

- Stale previews and missing individual/Final updates; save refresh/cache handling repaired.
- Rack regeneration replaying incompatible old edits; source/draft compatibility repaired.
- Cog reflections lost after flattened saves; material detection improved.
- Pencil color conversion and smooth normals obscuring changes; corrected.
- Outside-click selection clearing, double-click handlers, read-only handlers and drag guards repaired.
- Save origin/port connection errors and stopped local servers addressed.

### Packaging

- Complete standalone asset snapshot: exports, editor sources, save metadata, retained backups/pending/candidates, scripts and historical screenshots.
- Portfolio driving, car, track, ramps and website placement excluded.
- MIT license, README, third-party notices, catalog, timestamp, hash inventory and verifier added.
- Independent start/build entry; optional workshop return link.
- Deployment deferred with five-hour usage already 88% at packaging start.

### Limitations

- Slower double-clicks may briefly select with the 200 ms delay.
- Unsaved browser-local drafts are not disk files and are not captured.
- Exact original one-prompt High unavailable; earliest retained comparison preserved.
- Historical scripts/screenshots contain superseded variants.
- This packaging operation does not constitute a complete browser regression pass.
- Car collisions are outside the library and remain unimplemented.
- GitHub Pages requires project-path adaptation/testing; static hosting cannot run the save backend.

## GitHub Pages — October 11, 2026

- Published from the public repository at https://kledawson.github.io/Asset-Library/.
- Added a GitHub Actions build/deployment workflow and corrected project-subpath model URLs.
- Added hosted IndexedDB saving, Final synchronization, and previous/next save restoration. Hosted saves are local to the current browser and do not commit to GitHub.
- Stored saved GLBs as binary Blobs; shared the Final export/source Blob and avoided redundant metadata copies in localStorage.
- Staggered background model preloading and cleared obsolete preloaded revisions after saves.
- Preserved every approved model, editor source and historical version; no approved geometry or lighting changed.
