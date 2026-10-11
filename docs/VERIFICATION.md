# Snapshot verification

Verified October 11, 2026 (PDT).

- Model check passed: 32 public GLB files have valid headers and lengths; referenced external resources exist or are embedded.
- All four rack editor sources and all eight individual exports/editor sources are present.
- Local source imports resolve; saved-transform metadata parses.
- Standalone production build passed with existing lint warnings (hook dependency, comparison expression precedence, and an unnecessary escape) and a bundle-size advisory.
- Source/metadata scan found no matching private-key or common API-token signatures.
- Initial archive commit: `83658ac828e250f7d84b223696677c9603eed3df`; GitHub main matched that commit after push.
- Repository visibility confirmed private.

The file inventory excludes itself, installed dependencies, build output and Git metadata. Snapshot hashes describe files at capture; the complete packaged inventory includes standalone adaptations and documentation.

No public deployment or browser regression pass was performed. After pushing, five-hour usage was 93% used, so deployment is deferred as requested. See the README for project-subpath and save-service hosting requirements.

## GitHub Pages verification — October 11, 2026

- Repository made public with explicit author approval.
- Deployment workflow 38173242053 completed successfully.
- Live site: https://kledawson.github.io/Asset-Library/.
- All 32 published GLBs, index page and saved metadata passed HTTP/header checks. One transient CDN 503 passed on retry.
- Live browser: four rack versions rendered; all eight assets loaded with editable part lists (driver 6, wrench 23, cog 1, triangle 212, hammer 34, plant 21, notebook 1, pencil 7).
- Live interactions checked: triangle Drop/Reset, Item/Element selection, numeric element movement, Undo/Redo, double-click All/Final navigation, whole-wrench selection and outside click.
- Live Save Model, reload persistence and Previous/Next Save passed with the pencil; the synchronized Final rack rendered afterward.
- No browser console errors appeared during this test session.
- Binary storage/subpath/restore regression check passed. GitHub's clean dependency-install issue was fixed with the project's legacy peer-resolution configuration.
- No approved GLB exports, editor geometry or scene lighting were modified during deployment.

Hosted saves belong to the current browser. They do not write commits to GitHub. These targeted checks do not guarantee every possible edit, shortcut, device or browser combination.
