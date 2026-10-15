# Play Props — first pass

Created October 11, 2026 (America/Los_Angeles).

Eight new individual Default models and a grouped complete-set view: wooden ramp, large/small parcels, decorated cube, coral block, orange block, teal wedge and yellow ball.

Timestamped images here show the local first-pass previews. The package-scene concept reference is in `../concepts/` under `workshop-package-scenes`.

Models live in `public/models/play-*.glb`; edit baselines in `public/models/editor-sources/play-*.glb`. Save Model links individual edits into `play-props.glb` while preserving other props and workshop files. Retained save histories use the existing backup system.

Verification: all eight individual save/sync/restore paths pass against isolated files; cross-package writes are rejected. Production build passes with pre-existing lint warnings.
