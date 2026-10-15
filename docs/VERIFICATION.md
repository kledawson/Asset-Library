# Snapshot verification

## Live release archives — October 15, 2026

- [Deployment 38708855289](https://github.com/kledawson/Asset-Library/actions/runs/38708855289) passed the Latest build, archive storage tests, both tagged builds, nested resource checks, Pages publication, and automatic release-note links. Deployed application/tooling commit: `0b58e3f580100b0992036ab952edadd8e5dcb58f`.
- [Version 1.0](https://kledawson.github.io/Asset-Library/versions/1.0/) uses original commit `b2f4c371673b28b77711778d1b46262a3c2faf6d`. All 32 model files, saved metadata, archive commit marker, and script paths passed live checks.
- [Version 1.1](https://kledawson.github.io/Asset-Library/versions/1.1/) uses tagged commit `a1f2639048f0a85f6f742b9cc153beb5a2e92885`. All 88 model files and the same page/metadata checks passed. The latest main site also passed all 88 model checks after publication.
- Browser checks confirmed the original 1.0 rack/editor and 1.1 Organized Play Props render with their own archive labels and navigation. Neither archive captured console warnings/errors during the pass.
- Made a tiny reversible transform in the 1.0 Wrench, saved it in that archive's browser storage, and restored it with Previous Save. The 1.1 archive opened independently with its default view. Storage tests separately verified namespace separation and that clearing one archive leaves Latest and other versions intact.
- Both GitHub release descriptions now contain their version-specific Live Demo links. [Version History](https://kledawson.github.io/Asset-Library/versions/) lists October 11 and October 14 checkpoint dates and a Latest link.
- Progress captures: [1.0](../assets/progress/asset-library/2026-10-15_02-01-23_-0700_live-archive-1-0-v01.jpg), [1.1](../assets/progress/asset-library/2026-10-15_02-01-23_-0700_live-archive-1-1-v01.jpg), and [history page](../assets/progress/asset-library/2026-10-15_02-01-23_-0700_live-version-history-v01.jpg).

This record and the screenshots are documentation only. They do not change the deployed app or tagged snapshots. Archive build details are in [Live release archives](RELEASE-ARCHIVES.md).

## Checkpoint 1.1 — October 14, 2026

- Verified 88 GLBs and their required editor sources, embedded resources, saved metadata, and local imports.
- Rebuilt the portable catalog from the active application: 18 asset entries and 34 active model versions across two packages.
- Verified package, lockfile, and shared UI metadata retain checkpoint 1.1 (internal package version 1.1.0).
- Production build passed with the existing lint warnings. Hosted-storage checks passed for project-subpath URLs, binary saves, shared exports/sources, Previous/Next Save, and reloads.
- A color-edit smoke test passed through the temporary save service and both Play Prop Set assemblies, preserving unrelated colors and placements. Missing-backup handling left the tested GLB intact.
- Checked README/changelog targets and gallery images, and scanned source/metadata for common credential patterns.
- Retained approved model exports, sources, history, concepts, and progress captures; recorded model sizes and SHA-256 hashes in [the 1.1 manifest](releases/1.1-manifest.json).
- Merged [release PR #1](https://github.com/kledawson/Asset-Library/pull/1) into main and published [checkpoint v1.1](https://github.com/kledawson/Asset-Library/releases/tag/v1.1), pointing to `a1f2639048f0a85f6f742b9cc153beb5a2e92885`.
- The [Pages build and deployment](https://github.com/kledawson/Asset-Library/actions/runs/38687572991) completed successfully. Live checks passed for the index page, saved metadata, and all 88 GLBs.
- Browser checks on the published 1.1 app confirmed Loose and Organized layouts, the Final rack, individual color tabs and material controls, the editor Drop Test guard, Drop/Reset, and help expansion/keyboard isolation. No warnings or errors were captured during this pass. These are smoke checks rather than an exhaustive test of every interaction.
- Confirmed all four README showcase/gallery images load on GitHub. Archived the [published Play Props capture](../assets/progress/play-props/2026-10-14_22-38-34_-0700_published-checkpoint-1-1-v01.png).
- The final verification record and screenshot are a documentation follow-up to 1.1; they do not change assets or application code or increment the version. The next substantial update is 1.2.

The October 11 records below describe the earlier checkpoint and its deployment.

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
