# Controls & help — design plan

Prepared October 12, 2026 (Pacific time). The Section cards design is now implemented locally; the original interactive mockups remain archived.

## Design

- A 44 px cream circular **i** button at bottom right, with the accessible label “Controls & help.” Keep it clear of draggable panels.
- Clicking opens a large centered cream window with a lightly dimmed background (start at 13% opacity). Preserve the model, camera, selection, and unsaved edits.
- Header: “Controls & help,” a short introduction, and a visible close button.
- Six sections: **Asset Library**, **Camera & rotation**, **Preview Settings**, **Model Editor · selection**, **Move, rotate & resize**, **Saving & edit history**. A smaller **Workspace panels** section covers panel positioning and collapse.
- Each row has a keycap or mouse/action symbol, a plain description, and a short condition where needed. UI buttons have labeled chips rather than invented keyboard shortcuts.
- Recommended layout: two columns of sections, with frequent controls visible and “All controls” expandable underneath. Alternative: one column of expandable sections. The mockup includes both.
- Existing palette: cream window, dark slate text, teal headings, warm brown secondary text, understated keycaps. Reuse the app’s typography and rounded corners.

## Verified control inventory

Audited `src/AssetPreview.jsx`, `src/EditableModel.jsx`, `src/savedModels.jsx`, `src/assetModelRules.js`, and the current OrbitControls integration.

### Asset Library

| Control | Action / condition |
| --- | --- |
| Up / Down | Previous / next asset; stops at the ends. |
| Left / Right | Previous / next version tab, including All; stops at the ends. |
| Page Up / Page Down | Previous / next package; stops at the ends. |
| Package dropdown | Choose a package; opens its first asset. |
| Asset dropdown | Choose an asset; each parcel remembers its last version tab. |
| Version tabs | Select a color or quality version. Single-version assets show Default. |
| All | Compare the available versions together; comparison is not editable. |
| Double-click model in All | Enter that version. |
| Double-click model in a single view | Return to All; editor selection is canceled. |
| Double-click rack background | Return to All. |

### Camera & rotation

| Control | Action / condition |
| --- | --- |
| Left-button drag | Orbit the camera, away from editor handles. |
| Mouse wheel | Zoom. |
| Right-button drag | Pan. |
| Drag gray ring | Rotate the asset around its vertical axis. |
| Left / right curved-arrow buttons | Rotate the asset by an increment. |
| Reset view | Restore the camera, rotation, and drop state. Model edits are preserved. |

### Preview Settings

| Control | Action / condition |
| --- | --- |
| Drop test | Raise and release one individual version; editor must be closed. |
| Reset prop | Return to the starting preview pose and freeze it. Button alternates with Drop test. |
| Hide / Show labels | Toggle model labels and their rotation buttons. |
| Open GLB | Validate and preview a local GLB in Imported Models; does not replace a catalog asset. |

### Model Editor · selection

| Control | Action / condition |
| --- | --- |
| Edit Model / Close Editor | Toggle editing; opening also clears the drop state. |
| Item | Select and transform a grouped object; teal highlight. |
| Element | Select one part; orange highlight. |
| Single click | Select according to Item / Element mode; selection has a 200 ms delay to distinguish double-click. |
| Click empty space | Clear selection. |
| Escape | Clear the selected element or item. |
| Filter parts | Search names. |
| Selected part dropdown | Select a specific element. |
| Show Original / Show Changes | Compare the original/source view with current edits; editing is disabled while viewing Original. |
| Historical / comparison views | Rack Light, Medium, High and All are read-only. Choose Final for the rack; choose a single parcel color for parcels. |

### Move, rotate & resize

| Control | Action / condition |
| --- | --- |
| W / Move | Move using transform handles. |
| E / Rotate | Rotate using transform handles. |
| R / Resize | Scale using transform handles. |
| Precise adjustments | Selected element position X/Y/Z, rotation X/Y/Z in degrees, size X/Y/Z. |
| Duplicate Selected | Element mode, selected element required. |
| Remove Selected | Element mode; hide an original part or remove a duplicate from the edit. |
| Reset Part | Restore selected element position, rotation, and scale to saved/source values. |

### Saving & edit history

| Control | Action / condition |
| --- | --- |
| Save Model | Apply edits; individual tools update Workshop Final and Play Props individuals update Play Prop Set. Other comparison versions remain preserved. |
| Previous Save | Restore a saved backup when available. |
| Next Save | Return to the later saved version when available. |
| Ctrl+Z / Undo | Undo an edit in the active editable asset version. |
| Ctrl+Shift+Z / Redo | Redo an undone edit. |
| Ctrl+C | Copy a selected element. |
| Ctrl+V | Duplicate the copied element in the same asset version. |
| Ctrl+B | Duplicate a selected element. |
| macOS Command | Existing editor handler accepts Command in place of Ctrl. Label it by platform in the help. |
| Hosted saves | GitHub-hosted edits save in that browser; they are not Git commits. Local editor saves write GLB exports with backups. |

### Workspace panels

| Control | Action / condition |
| --- | --- |
| Drag panel heading | Reposition Asset Library, Preview Settings, or Model Editor. |
| Minus / plus | Collapse / expand each panel. |
| Back to workshop link | Available when the app has a configured workshop URL. |

## Scalability

- Store help entries as data: `id`, `section`, `inputKind`, `keys`, `title`, `description`, `availability`, and platform variants.
- Reuse shared navigation/shortcut definitions for both handlers and help, so labels stay accurate.
- New functionality adds entries or sections rather than another permanent help panel. No artificial empty cards; preserve generous spacing instead.
- In the real app, keep the header visible and let the dialog body scroll. Two columns on wider screens; one column on narrow screens. A compact section list can be added if the inventory grows substantially.
- Keep unavailable controls documented with clear conditions, rather than removing rows as the user changes assets.
- Keep the small inline Keyboard shortcuts disclosure as a quick reference initially; the full help window contains all controls.

## Modal behavior and accessibility

- Use a labeled modal dialog; focus enters the window and remains there until closed.
- Close with X, Escape, or the dimmed backdrop; return focus to the i button.
- Disable background camera, editor, and navigation shortcuts while help is open. Page Up/Down must scroll help content instead of switching packages; Escape must close help without deselecting the model.
- Stop a currently captured drag cleanly before opening, preserving its resulting pose. Prevent click-through when closing.
- Help must not reset the camera, alter models, discard edits, or write save files.
- Respect reduced motion; keep any fade brief and limited to the dialog/backdrop. Do not animate or rebuild the 3D scene.
- Use readable contrast, semantic headings, native disclosure buttons, keyboard focus styles, and a 44 px launcher/close target.
- Modal reference: [W3C ARIA modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Implementation sequence

1. Agree on Section cards or Expandable guide from the mockup.
2. Extract a small control catalog and shared navigation definitions; add `ControlsHelp` as a separate UI component.
3. Add the bottom-right launcher and modal state outside the Canvas. Opening help must not remount the preview.
4. Add input gating and focus management, then build the responsive cream layout.
5. Verify open/close, backdrop, Tab/Shift+Tab, Escape, long-content scrolling, narrow widths, and rapid navigation after closing.
6. Verify typing protection, editor/drop conditions, unchanged camera/selection/drafts, linked save explanations, and every documented control.
7. Archive review screenshots and update the changelog; build and verify references before publishing.

## Mockup scope

The interactive designs demonstrate opening, closing, and expanding control groups. They do not execute model actions. The lightly dimmed background uses an archived view of the actual local app. The initial local implementation uses white keycaps, aligned rows, consistent capitalization, and a rounded-square launcher. Verified Escape/backdrop closing, input gating, selected-element preservation, help scrolling, desktop/mobile layout, and build/reference checks.

## Design refinement

The initial help now includes local section/gesture icons, paired overview rows with shared heights, labeled continuation areas for expanded controls, a cream-integrated scrollbar, and a single top-right X close button. Escape and backdrop closing remain available. On narrow screens each expansion follows its own section.

## Current approved layout direction
Collapsed cards align in two independent columns. Native arrow + All controls disclosures expand inline and push only their own column down. The shortcuts-paused footer is restored; the single X, Escape, and backdrop closing remain.

## Naming and input types
App and help use shared Title Case labels, with Select Item and Select Part. Keyboard keys are warm-tinted; on-screen button labels are white; fields and gestures use icons. Expanding replaces All Controls with Fewer Controls below the additional rows.
