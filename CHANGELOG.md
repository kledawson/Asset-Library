# Changelog

## Unreleased — Pocket Post and Mobile Layout (Planned 1.2)

- Added **Pocket Post**, using Compact Drop, with Loose and Organized assemblies and six reusable entries: Parcel Mailbox, Mail Trolley, Parcel Scale, Tape Dispenser, Mail Sack and Dispatch Bin. Existing parcels remain in Play Props for later reuse.
- Refined the first shapes toward the chosen concept: honey wood with embedded grain, navy scale body, deeper teal painted metal, cream canvas, coral accents and brass details. Kept global preview lighting unchanged.
- Linked individual mail saves/restores to both assemblies while preserving each layout's placement. Retained generated candidates, editor sources, saved exports, metadata and backups together.
- Added open compound collision shapes for mail containers and a spring-driven sack deformation preview during individual Drop Test. Cloth motion uses temporary geometry and simplified collision proxies; full cloth simulation and independent contents remain future work.
- Archived actual local progress screenshots and retained further mail ideas in the existing package roadmap.

- Added a phone layout with a clear 3D viewing area and a compact control bar for Asset Library, Preview Settings, Model Editor, and Help.
- Reused the existing panel controls in mobile sheets, preserving package and version selection, preview actions, and model editing while keeping desktop layout unchanged.
- Moved the phone controls to the top by default and added a drag handle that snaps them to either edge. The open editor uses the opposite edge so the model remains visible.
- Made the mobile Model Editor a scrollable, height-adjustable panel with the same scrollbar styling as Help, and restored working Hide/Show Labels controls on phones.
- Integrated the mobile improvements into local main. Publication and the 1.2 version increment are deferred until the next authorized release.
- Retained the separate test site at `/Asset-Library/previews/mobile/` with isolated browser saves. Keep it available until removal is requested.

## 1.1 — October 14, 2026

Version-history refinement — October 15: added a Changelog link beside each release's Release Notes, opening the changelog from that exact tag. Future archive builds add these links automatically without rebuilding unchanged archive apps.

Release hosting follow-up — October 15: added live archive demos for tags v1.0 and v1.1, a version-history page, and automatic archive/demo links for future releases. Latest continues to follow main. Archived browser saves and drafts are isolated per version. This completes the 1.1 publication workflow without changing the current assets or incrementing the checkpoint.

Documentation follow-up — October 15: replaced the two README showcase images with actual in-app captures of Organized Play Props and the Final rack. Preserved the previous render/illustration in the visual archive. Added the original October 11 checkpoint to GitHub release history as v1.0; v1.1 remains the latest release.

**Scope:** changes after the published Tool Rack release, through October 14, 2026 (Pacific time).

Baseline: [`b2f4c37`](https://github.com/kledawson/Asset-Library/commit/b2f4c371673b28b77711778d1b46262a3c2faf6d), the last recorded `origin/main` commit, dated October 11, 2026. This is checkpoint **1.1**. The next substantial asset update will use **1.2**.

This section groups the resulting features and fixes by area. The [preserved development log](docs/history/2026-10-14_1.1-development-log.md) contains the smaller adjustments, intermediate designs, superseded experiments, and original dated entries. Work on the separate driving portfolio is outside this changelog's scope.

### Play Props Package

- Added Play Props as a separate package, with its own catalog and assets. Switching packages replaces the displayed collection while keeping the shared preview, editor, physics, and help tools.
- Created eight reusable asset types: Wooden Ramp, Large Parcel, Small Parcel, Decorated Cube, Timber Block, Chunky Block, Wedge, and Play Ball.
- Expanded the initial eight-prop set to twelve props with parcel colors, then to twenty props with the block, wedge, and ball variants.
- Added Coral, Yellow, and Teal versions for both parcel sizes, Timber Block, Wedge, and Play Ball. Chunky Block uses Coral, Orange, and Teal.
- Added All comparisons for colored individual assets, with consistent diagonal rows, spacing, camera framing, rotation controls, editing, and Drop/Reset behavior.
- Renamed the complete assembly to **Play Prop Set** and the color-named block entries to **Timber Block** and **Chunky Block**.
- Enlarged the set's gray rotation ring to leave room for more props while retaining standardized individual rings.
- Added **Loose** and **Organized** versions. Loose keeps the playful grouped formation; Organized presents the same twenty props in upright rows.
- Refined layout repeatedly: separated timbers from the ramp, gathered related props, opened gaps around wedges, varied new wedge rotations, and shifted Chunky Blocks away from balls to expose parcel details.
- Explored Decorated Cube display positions, including a front/right placement. Rolled back broader unwanted rearrangements and restored both layout versions after the debugging rollback.
- Kept each color independently selectable and reusable. Individual saves update the matching prop in both set layouts while retaining each layout's placement.

### Decorated Cube

- Centered the face decorations and paired them across all six sides: yellow circles, teal triangles, and coral squares on top and bottom.
- Removed the unwanted texture beneath the original yellow-circle decoration.
- Warmed the wood slightly and added grain beneath the colored shapes.
- Replaced identical grain on every face with varied patterns, then replaced raised line meshes with embedded wood color and subtle normal textures.
- Added flowing side grain and end grain, with variation in direction and structure rather than six repeated sets of lines.
- Reworked the caption into the short, playful **A little wooden cube full of colorful fun.**
- Restored the coral square after the color-picker demonstration by clearing its unsaved test color. The approved cube GLB remained intact.

### Parcel Shapes, Wrapping, and Postage Labels

- Created independent Coral, Yellow, and Teal variants for Large Parcel and Small Parcel.
- Matched the Decorated Cube's color/shape language: coral square, yellow circle, and teal triangle. Changed the postage symbols to black and reduced their size for better margins.
- Added shallow square recessed panels to the Small Parcel, mirrored on the opposite face with matching depth and walls.
- Seated the small cream labels inside their recessed faces, reduced label/symbol size, and refined their clearance from both the raised frame and wrapping.
- Rebuilt Small Parcel wrapping as continuous rounded loops to remove edge gaps.
- Widened the Large Parcel into a distinct rectangular silhouette, then reduced the excessive width to better match the selected concept.
- Replaced Large Parcel cross wrapping with two broader continuous parallel bands running over front, top, back, and bottom. Left the narrow sides free of bands.
- Added matching rounded carrying openings on both narrow sides, with recessed cardboard walls and dark interiors; corrected the initially missing opposite handle.
- Removed the Large Parcel's recessed front panel for a flatter cardboard face.
- Temporarily removed the Large Parcel postage labels during the wrap redesign, then restored them on the face opposite the upright arrows, in the bottom-right corner.
- Added the black **This Way Up** arrow pair to every large color on bare positive-X cardboard. Moved it from the left to the right of the wrapping and lowered it slightly.
- Added scalloped postage-stamp edges to all six cream shape labels.
- Preserved the separate parcel sizes, color variants, and unrelated props during individual saves and restores.

### Parcel Care Patches and Bottom Marks

- Added **F2 Fragile** stickers to both coral parcel sizes, with cream backing, coral border/glass artwork, size-specific placement, and slight natural rotation.
- Added a teal **K1 Keep Dry** design, explored a smaller symbol-only **K7** patch, and adjusted its size and placement before the later D3 redesign.
- Replaced both teal patches with the selected **D3** artwork: cream backing, clipped corners, double teal border, umbrella, raindrops, and Keep Dry text.
- Replaced rough hand-built patch geometry with high-resolution embedded artwork from the selected concepts to recover the intended umbrella, hands, lettering, and print quality.
- Reworked D3 border proportions so the teal band, cream gap, and outer keyline remain consistent through the corners.
- Improved text clarity, increased the umbrella slightly, and added faint deep-blue wave detail to the teal print.
- Reduced the D3 patch slightly; nudged the small patch inward, raised the large patch, and reversed the large patch's slight tilt.
- Added **H3 Handle With Care** to both yellow sizes. Improved the hands, changed the illustrated box to solid gold, and increased space between the symbol and caption.
- Made the small yellow patch slightly smaller and moved it to the right side of its positive-X face, clear of the wrap. Kept the large yellow patch on the back and raised it.
- Added recycling symbols to all six parcels, refined the folded-arrow design against the reference, and iterated corner placement with small X-axis offsets.
- Built the compact upside-down-L bottom cluster: recycling in the corner, FSC to its right, and CE below. Matched mark sizes, spacing, and edge margins; progressively reduced the group to the approved small scale.
- Applied the cluster to Small Parcels first, then replaced the Large Parcels' standalone recycling mark with the same design.
- Preserved open underside space for future labels and kept printed marks clear of wrapping and care patches.

### Timber Block and Chunky Block

- Added painted color variants and exposed wood on both opposite ends of each block, integrated into the actual faces rather than floating panels.
- Moved Chunky Block's wood to its top and bottom to distinguish it from Timber Block's wooden ends.
- Rebuilt the wooden ends as flat faces while retaining gentle rounding along the painted sides.
- Added embedded end-grain patterns, growth-ring structure, and fine pores; varied the grain between colors and between opposite ends of a block.
- Reduced normal-map relief so the grain reads as wood rather than raised ridges.
- Explored a larger, squarer Chunky Block silhouette. Reverted unwanted upright/width experiments and adjusted the blue-axis depth from 0.108 to 0.132 for the approved squarer side profile.
- Refreshed grounded instances in the set after proportion changes and preserved Timber Block while refining Chunky Block.
- Archived paint-dipped/block shape ideas while retaining the approved painted-side and exposed-end treatment.

### Wedges, Balls, and Drop Physics

- Added Coral and Yellow wedges alongside Teal, plus Coral and Teal balls alongside Yellow, with All comparisons and shared preview controls.
- Preserved the wedge design while refining set spacing and the coral/yellow wedge angles.
- Gave every ball a spherical drop collider, rolling release, controlled damping, and settling behavior.
- Corrected the ball's thud/pause before rolling: added a moderate rebound that overrides the floor's low bounce, gentler contact friction, and continuous collision detection.
- Verified the transition from impact to rebound, rolling, and settling across ball colors during development.
- Extended the established floating reset center, drop height, camera framing, and rotation controls to the new individual assets.

### Wooden Ramp

- Replaced the first-pass ramp with the selected flush-deck design: blue-gray driving surface, wooden rails, brass hardware, white chevrons, open underside, and rear support legs.
- Widened the deck beneath the rails to close visible slits between wood and ramp surface.
- Tapered the deck and rails toward the floor and moved the front support underneath the deck.
- Corrected rear-foot flicker caused by overlapping wood and rubber faces by seating the wood inside the feet.
- Tried black front grip pads, then removed them while retaining the rear padded feet.
- Replaced large blank brass side circles with smaller, low-profile slotted screw heads.
- Moved side screws to structural joints and aligned the rear pair with the leg connection before later reducing the screw count.
- Replaced raised wood-grain geometry with subtle embedded color texture, with variation across rails, legs, and cross braces.
- Rotated the middle underside beam to follow the ramp slope and added a second textured cross brace toward the entry.
- Spaced the two braces and matching side screws at one-third and two-thirds along the ramp.
- Moved the lower top screw pair toward the entry, just behind the front lip bend.
- Removed the tallest side screw beside each rear leg, leaving four top screws and four side screws.
- Saved the individual ramp and synchronized its set instances while preserving other props and global lighting.

### Workshop Tool Rack Follow-Up

- Added circular mounting bases to both wrench hooks, using the other approved hook bases as the reference.
- Corrected bases buried inside the wooden board so their faces protrude slightly and remain visible.
- Preserved the restored rack layout, hook positions, removed corner screws, and historical comparison exports during these changes.

### Asset Library and Navigation

- Added permanent Up/Down navigation through assets, Left/Right navigation through version tabs, and Page Up/Page Down navigation through packages.
- Removed wraparound at the beginning and end of all three lists.
- Changed the initial Left/Right package mapping to version navigation; package switching moved to Page Up/Page Down.
- Protected text and color field editing from navigation shortcuts, including the material selector and color-square keyboard controls.
- Cleaned up ring pointer capture and orbit state when switching assets during a drag.
- Remembered each colored asset's last selected version rather than resetting to All.
- Added a **Versions** heading beneath Package and Asset, with matching field spacing and control heights.
- Moved repeated orbit/zoom/pan instructions into Controls & Help.
- Added concise brown asset descriptions, including per-color captions and rack-version descriptions; refined the cube caption for length and tone.
- Replaced **Asset Workshop** branding in panel headers with shared **VERSION 1.1** labels and the Asset Library browser title.
- Tightened version-label letter spacing so 1.1 no longer looks spread apart.
- Restored the initial rotation-ring gray and used evenly spaced idle, hover, and pressed opacity steps: 0.24, 0.42, and 0.60.

### Controls & Help

- Added the bottom-right rounded-square information launcher and cream modal over a lightly dimmed preview.
- Grouped controls into sections covering library navigation, camera/ring gestures, Preview Settings, selection, transforms, color/materials, saving/history, and workspace panels.
- Added section icons, keyboard keycaps, mouse-wheel/drag illustrations, cursor graphics, and Select, Deselect, and Double Click captions.
- Enlarged the dotted deselection target and placed its cursor partly inside and outside the circle.
- Standardized shared Title Case labels between the actual application and help descriptions; reviewed every description for clarity and removed redundant wording.
- Distinguished white keyboard keys from warm on-screen buttons and teal toggle demonstrations.
- Iterated between section cards and expandable layouts, then used independent columns: expanding a section adds controls beneath it and moves that column down.
- Replaced boxed expansion controls with inline chevrons and **All Controls** / **Fewer Controls**, placing the collapse action below the expanded content.
- Added a footer explaining that app shortcuts pause while Help is open.
- Replaced separate bulk actions with one stable-width **Expand All / Collapse All** button, teal when collapsed and warm when fully expanded.
- Simplified closing to the top-right X or backdrop, removing the redundant visible Escape/close footer action.
- Integrated a warm scrollbar and responsive scrolling; removed the unwanted focus line beside the header/footer of the scrollable help area.
- Refined control-column alignment, gesture icon rails, paired row spacing, and vertical centering beside titles/descriptions.
- Converted on-screen examples into clickable dummy buttons; actual application actions remain paused behind Help.
- Added isolated Show/Hide Labels, Edit/Close Editor, and Show Original/Show Changes demonstrations. Kept toggle demos teal in both label states and after reopening.
- Removed **Click To Try / Help Demo Only** captions and split Previous Save and Next Save into separate entries.
- Added the Asset label rotation demo with clickable left/right arrows; reset it upright whenever Help opens or closes.
- Added held-key feedback, including W/E/R and full modifier combinations. Combined shortcuts highlight only while all required keys are held.
- Styled presses with inset depth and a gray key face while retaining borders, text color, and dimensions; added consistent button hover/press feedback across the application.
- Stabilized two-state button widths in Help and the app, including Show/Hide, Edit/Close, Save/Saving, and All/Fewer Controls.
- Removed the duplicate Model Editor Keyboard Shortcuts disclosure after consolidating those controls into Help.
- Fixed native Escape cancellation leaving Help stuck closed or unable to reopen. Synchronized native dialog state and the launcher.
- Disabled native Escape dismissal and Page Up/Page Down scrolling while Help is demonstrating shortcuts; retained Tab navigation and key feedback.
- Clear held-key feedback when keys are released, Help closes, the window blurs, or visibility changes.

### Model Editor and Material Colors

- Reorganized the panel into roomier **Selection**, **Transform**, and **Appearance** sections with consistent button grids.
- Made all three sections independently collapsible with clear chevrons, retaining the existing Precise Adjustments disclosure.
- Added an internal scroll area while keeping Save Model and Previous/Next Save at the bottom.
- Added a saturation/brightness square, Hue and Brightness sliders, Hex entry, RGB channels, current-color swatch, and Reset Color.
- Support color edits on a whole selected item or one selected part, with a material selector for parts that use multiple materials.
- Preserve existing texture maps, roughness, and metalness; clone edited materials so shared source materials do not recolor unrelated parts.
- Convert picker sRGB values explicitly to linear GLTF material factors and back for consistent preview/export colors.
- Added color overrides to drafts, Undo/Redo, saved metadata, read-only previews, GLB exports, and linked assembly rebuilds.
- Group continuous color adjustments into history gestures and defer draft storage writes briefly to reduce work during dragging.
- Exclude material-description metadata from the unsaved-edit comparison.
- Added Color & Materials entries to Controls & Help.
- Replaced the silently disabled Drop Test button during editing with a popup explaining the restriction and a **Close Editor & Drop** action.

### Preview Settings and Open GLB

- Aligned Preview Settings with Model Editor's width and standardized its icon sizes, button heights, spacing, and toggle layout.
- Grouped Reset View and Show/Hide Labels above Drop Test and Open GLB, leaving the layout ready for additional controls.
- Added a short explanation of Open GLB's temporary local-preview behavior.
- Keep imported models in Imported Models for preview only; prevent unsupported saves into the approved asset catalog.
- Reset drop/original-preview state and close editing when opening a local GLB.
- Catch file-read errors and reject invalid GLB headers before replacing the active asset; display a dismissible message.
- Clear file errors when returning to another library asset.
- Tested a disposable GLB copy, label visibility, Reset View, and invalid-file rejection; removed the temporary import and returned to the original cube/editor view.
- Verified all approved model files and save metadata were unchanged by that preview test.

### Saving, Loading, Camera, and Recovery Fixes

- Generalized asset filenames, allowed-file validation, and linked assemblies for Play Props and its color variants.
- Keep individual Play Prop saves scoped to their matching color and both set layouts; reject cross-package file writes.
- Fixed consecutive saves rebuilding a set from an older preview copy. Local set previews and rebuilds now read the authoritative save-service assembly with caching disabled.
- Support both Loose and Organized model URLs in local save-service routing while preserving GitHub project-path behavior for hosted models.
- Start the save helper automatically when launching the local Asset Library if port 3001 is absent.
- Recovered interrupted local previews after switching servers left the save helper offline. Model requests, rather than the page itself, use the local helper; this was distinct from a graphics-context initialization failure.
- Repaired model-fetch failures that returned HTML instead of a GLB, failed to fetch entirely, or referenced a newly added color file before it was installed.
- Added a preview recovery message, Retry Preview, periodic availability checks, and failed-loader-cache clearing. Switching assets can clear a failed preview.
- Standardized the camera pose before bounds fitting so package switches do not inherit previous pan/zoom or an unfinished fit animation.
- Fit before the first rendered frame to reduce flicker during rapid Page Up/Page Down switching.
- Allow underside inspection of floating props while keeping the camera above the floor; adapt the orbit limit to zoom and pan.
- Made staged metadata updates atomic to reduce intermittent file-watcher errors.
- Check that local backup files actually exist before enabling Previous Save or Next Save.
- Return a clear unavailable-backup message for missing files; the missing-backup path leaves the current GLB intact.
- Recovered retained models and restored Loose/Organized navigation after reverting unsuccessful layout/debugging changes. No claim is made that model-fetch recovery prevents every browser/GPU WebGL failure.

### Visual Archive, Documentation, and Versioning

- Archived the original workshop concept, a separated asset sheet, and grouped package visuals; added a milestone marking the end of the Tool Rack phase.
- Planned reusable scene packages in ASSET-PACKAGES.md and established the one-package-at-a-time workflow.
- Saved parcel-detail concepts, label variations, yellow handling-symbol studies, umbrella/hand references, block-shape and paint-dipped ideas, wedge-detail ideas, and a high-resolution Do Not Stack concept. Unselected concepts remain references rather than active features.
- Archived both Controls & Help design concepts, development screenshots, and lighter preview images for review.
- Established persistent progress captures at worthwhile visual milestones rather than on a fixed timer; frame 3D assets clearly and retain earlier iterations.
- Use Pacific local timestamps and the actual UTC offset in visual filenames, with concepts/references under assets/raw-assets and progress captures under assets/progress.
- Adopted **Release.Patch** naming: 1.1, 1.2, ... 1.10; a new main website version begins at 2.1. Internal npm versions retain a third zero for tooling.
- Added shared version metadata and patch/release commands. Increment once for substantial updates; corrections and follow-up fixes keep the reserved version.
- Retained the publishing/version reminder in project instructions; this update already owns version 1.1.
- Rewrote README with both collections, the twenty-prop set, current controls/material editing, automatic helper startup, local-versus-hosted saving, and links to detailed documentation.
- Added a matching Workshop Tool Rack showcase below Play Props in README, plus a compact expandable gallery of actual app captures. Archived the generated illustration and its prompt.
- Consolidated this changelog against the last pushed baseline while preserving the original working log and released history below.

### Recorded Verification

- Asset verification passed for 88 GLBs, required sources, embedded resources, save metadata, and local imports.
- Production builds completed with the existing lint warnings recorded during development.
- Targeted individual-save, variant-sync, and restore checks covered preservation of unrelated props and assembly placement; ball physics checks covered rebound, rolling, and settling.
- The new color/export smoke check passed for a variant in both set layouts, including isolation of unrelated colors and a missing-backup check.
- Browser checks covered the new color fields, collapsible sections, Close Editor & Drop flow, local GLB import/rejection, label visibility, and returning to the original asset.
- Published checkpoint v1.1 after the production build and Pages workflow passed. Live checks verified all 88 GLBs and the main preview, editor, and help flows; see the [verification record](docs/VERIFICATION.md) for scope and the archived deployment screenshot.

---

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
