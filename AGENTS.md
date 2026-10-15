# Asset editing

Preserve approved exports. Stage generated candidates using `node scripts/stage-asset.cjs <asset:version> <candidate.glb>` and apply through Save Model.

Individual saves update Final only. Preserve Light, Medium, and High comparison models. Keep exports, sources, save metadata, backups and pending geometry together.

Keep this repository scoped to the Asset Library. Preserve global lighting when editing a material. Update the changelog and verify model references/build before publishing.

# Visual archive and package workflow

When creating an asset, save its generated concept images, reference visuals, comparison renders, and review screenshots under `assets/raw-assets/<package-id>/`. Archive visuals by default; do not leave the only copy in temporary or generated-image storage. Timestamp every visual filename using Pacific local time and UTC offset: `YYYY-MM-DD_HH-mm-ss_-0700_description-v01.png` (use the actual offset, including -0800 during standard time). Preserve earlier iterations, and keep final GLB exports in their existing model folders. For older reference images, record that the timestamp is archive time rather than original creation time.

Work on one package at a time. Each package is a scene assembly containing separately editable/reusable assets. Consult `docs/ASSET-PACKAGES.md` before starting; do not implement planned packages until the user chooses one. Reuse approved props across packages rather than duplicating their source assets.

# Progress screenshot routine

During active work in this project, periodically capture the current asset or UI being worked on. Use judgment to capture worthwhile visual progress: meaningful milestones, larger changes, and small but crucial refinements when they help document the evolution. There is no timed interval and no requirement to capture every text edit. Before capturing a 3D asset, choose a clear camera angle, rotate and frame the object to show the change, and keep useful surrounding context. Capture completed visual work when worth recording. Avoid duplicate unchanged views; this is a working-session routine, not a background monitor.

Save these screenshots in `assets/progress/<package-id>/` (use `asset-library` for shared UI work). Use Pacific local timestamps and the actual UTC offset: `YYYY-MM-DD_HH-mm-ss_-0700_description-v01.png` (-0800 during standard time). Keep earlier screenshots. Concept/reference visuals still belong in `assets/raw-assets/<package-id>/`. This routine is a persistent project preference for future sessions.

# Asset Library release versioning

Before a GitHub commit/push for a substantial feature update or major patch, automatically handle the Release.Patch increment (1.1, 1.2, … 1.10) once for that update using `npm run version:patch`. Do not increment for small edits, accidental/broken pushes and their corrections, or follow-up fixes to the same update. Do not bump again just because a commit is retried or pushed. Check whether the current work already contains its version bump; checkpoint 1.1 is complete; the next substantial asset update uses 1.2. Release corrections and publishing retries remain 1.1. Keep shared UI version, package/lockfile metadata, changelog and GitHub tag consistent. Only start a new main release (2.1, 3.1, etc.) when the user identifies it as a new website version. This reminder is part of the release workflow whenever preparing an authorized GitHub push; it does not authorize publishing by itself.
