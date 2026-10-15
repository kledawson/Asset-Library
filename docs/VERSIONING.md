# Asset Library versions

Published checkpoints also receive a separate live demo under `/Asset-Library/versions/<Release.Patch>/`. The main address follows the latest `main` code. The Pages workflow automatically preserves tagged demos and adds their links to GitHub release notes; see [Live release archives](RELEASE-ARCHIVES.md). Keep published tags fixed so their snapshots retain the original code and assets.

## Format: Release.Patch

- **1.0** identifies the original published website.
- **1.1** is the second checkpoint, adding Play Props and the expanded editor. The next substantial asset update uses **1.2**.
- Increment the patch for each substantial feature update or major patch: **1.2**, **1.3**, … **1.9**, **1.10**, **1.11**.
- A new main website version starts at **2.1**, then **2.2**, and so on.
- Components are integers. **1.10 follows 1.9** and is distinct from **1.1**.

The UI reads `src/libraryVersion.json` through one shared module. Every panel displays the same version. GitHub tags use **v1.1**, **v1.2**, etc.; commit messages can begin with **[1.1]**, **[1.2]**, etc.

## Preparing the next substantial update

Run `npm run version:patch` once before committing a substantial new update. Do not increment for small edits, mistaken pushes and their corrections, or follow-up fixes to the same update. A commit retry or push does not cause another increment. Checkpoint **1.1** already includes its version bump. Do not bump it again for release corrections or publishing retries. Increment once to **1.2** when preparing the next substantial asset update. Run `npm run version:release` when starting a new main website version. These commands update the displayed version and package/lockfile metadata together; they do not create commits, tags, or deployments.

Before committing, record the same displayed version in the changelog and run the asset verification and build checks. When publishing, give the corresponding GitHub tag that same version. Keep the version bump in the same commit as its changes.

Node package metadata requires three components, so display version **1.10** uses internal package version **1.10.0**. The third zero is only for package tooling; panel headers and GitHub tags use the chosen two-component convention.

The reminder is saved in AGENTS.md so the assistant applies this policy whenever preparing a future authorized GitHub push. Version updates happen before the commit, keeping the deployed headers and commit metadata together.
