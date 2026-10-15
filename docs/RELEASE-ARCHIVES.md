# Live release archives

The main [Asset Library](https://kledawson.github.io/Asset-Library/) follows `main`. Each Release.Patch tag gets a separate demo built from that tag's exact commit and model files:

- [Version 1.0](https://kledawson.github.io/Asset-Library/versions/1.0/) — original October 11, 2026 checkpoint.
- [Version 1.1](https://kledawson.github.io/Asset-Library/versions/1.1/) — October 14, 2026 Play Props checkpoint.
- [Version History](https://kledawson.github.io/Asset-Library/versions/) — all tagged demos, newest first.

## Automatic publication

Pushing `main` updates Latest. Publishing a release, pushing a `vRelease.Patch` tag, or manually running the Pages workflow rebuilds the Pages package with all tagged demos included. The workflow checks out `main` for the deployment tooling, then extracts each tagged app into an isolated build folder. The root app remains the latest `main` code, even when the workflow was triggered by an older tag.

The archive builder installs the tagged lockfile, verifies the tagged model files, and builds with that version's nested public URL. Cache entries are keyed by tag commit and deployment-adapter recipe; subsequent main pushes reuse archived builds. Do not move or overwrite published release tags. Tag the next checkpoint instead.

After a successful deployment, release notes receive an **Open Version** link, a Latest link, and a Version History link automatically. This is part of release publishing, not a scheduled task.

## Historical fidelity and browser saves

The original app source and GLB exports are taken from the tag. Deployment adapts only three things in the temporary build copy: the public URL, the namespace for browser saves/drafts/view preferences, and a small archive navigation label. Historical UI, asset geometry, materials, lighting, and behavior otherwise remain those of the tagged version. The Git tags themselves are never changed.

Each version has its own IndexedDB database and local/session-storage key prefix. Editing an archive in a browser does not alter Latest, another archive, or the published files. `release-snapshot.json` beside every archive records its original commit and deployment adaptations.

## Validation

`node scripts/test-archive-storage.cjs` checks version isolation and scoped clear/key operations. After the main app build, `node scripts/build-release-archives.cjs` assembles the archives and `node scripts/verify-release-archives.cjs` verifies nested script paths and model inventories. For live checks, pass the site origin to the verifier: `node scripts/verify-release-archives.cjs https://kledawson.github.io`.

The first build of each new tag installs its own locked dependencies; later pushes reuse the archive cache. Cache/work directories and compiled sites are ignored by Git. The archive assets are included in the Pages deployment artifact, so a later deployment keeps prior demos available.
