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
