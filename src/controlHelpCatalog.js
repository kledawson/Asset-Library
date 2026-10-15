import { controlLabels } from './controlLabels';
const sections = [
  {
    "title": "Asset Library",
    "icon": "library",
    "rows": [
      {
        "id": "library-0",
        "keys": [
          "↑",
          "↓"
        ],
        "title": "Previous / Next Asset",
        "description": "Stops at the first and last asset.",
        "kind": "keyboard"
      },
      {
        "id": "library-1",
        "keys": [
          "←",
          "→"
        ],
        "title": "Previous / Next Version Tab",
        "description": "Includes All; stops at either end.",
        "kind": "keyboard"
      },
      {
        "id": "library-2",
        "keys": [
          "Page Up",
          "Page Down"
        ],
        "title": "Previous / Next Package",
        "description": "Stops at the first and last package.",
        "kind": "keyboard"
      },
      {
        "id": "library-3",
        "keys": [
          "Package"
        ],
        "title": "Choose A Package",
        "description": "Each package contains its own set of assets.",
        "kind": "field",
        "icon": "package"
      },
      {
        "id": "library-4",
        "keys": [
          "Asset"
        ],
        "title": "Choose An Asset",
        "description": "Choose an individual item or the complete set.",
        "kind": "field",
        "icon": "cube"
      },
      {
        "id": "library-5",
        "keys": [
          "Version Tabs"
        ],
        "title": "Choose A Version Or Compare",
        "description": "All compares versions. Choose a single version to edit; use Final for the rack.",
        "kind": "field",
        "icon": "panels"
      },
      {
        "id": "library-6",
        "keys": [
          "Double-click"
        ],
        "title": "Double-Click To Enter / Leave A Version",
        "description": "In All, open a version. In a single view, return to All.",
        "kind": "gesture"
      }
    ]
  },
  {
    "title": "Camera & Rotation",
    "icon": "orbit",
    "rows": [
      {
        "id": "orbit-0",
        "keys": [
          "Left Drag"
        ],
        "title": "Orbit The Camera",
        "description": "Drag in the preview, away from transform handles.",
        "kind": "gesture"
      },
      {
        "id": "orbit-1",
        "keys": [
          "Scroll"
        ],
        "title": "Zoom In / Out",
        "description": "Scroll up to zoom in; down to zoom out.",
        "kind": "gesture"
      },
      {
        "id": "orbit-2",
        "keys": [
          "Right Drag"
        ],
        "title": "Pan The Camera",
        "description": "Slide the view without changing its angle.",
        "kind": "gesture"
      },
      {
        "id": "orbit-3",
        "keys": [
          "Ring Drag"
        ],
        "title": "Rotate The Asset",
        "description": "Turns the model around its upright axis.",
        "kind": "gesture"
      },
      {
        "id": "orbit-4",
        "keys": [
          "↶",
          "↷"
        ],
        "title": "Rotate Left / Right",
        "description": "Turn the model by one step per click.",
        "kind": "button",
        "labelIds": [
          null,
          null
        ]
      },
      {
        "id": "orbit-5",
        "keys": [
          "Reset View"
        ],
        "title": "Restore The Preview",
        "description": "Restores the view and stops the drop test; keeps edits.",
        "kind": "button",
        "labelIds": [
          "resetView"
        ]
      }
    ]
  },
  {
    "title": "Preview Settings",
    "icon": "sliders-horizontal",
    "rows": [
      {
        "id": "sliders-horizontal-0",
        "keys": [
          "Drop Test"
        ],
        "title": "Raise And Drop The Prop",
        "description": "Single prop view; editor closed.",
        "kind": "button",
        "labelIds": [
          "drop"
        ]
      },
      {
        "id": "sliders-horizontal-1",
        "keys": [
          "Reset Prop"
        ],
        "title": "Return To Its Starting Pose",
        "description": "Holds the prop still until the next Drop Test.",
        "kind": "button",
        "labelIds": [
          "resetProp"
        ]
      },
      {
        "id": "sliders-horizontal-2",
        "keys": [
          "Labels"
        ],
        "title": "Show / Hide Labels",
        "description": "Includes the rotation buttons beside each label.",
        "kind": "button",
        "labelIds": [
          "showLabels",
          "hideLabels"
        ]
      },
      {
        "id": "sliders-horizontal-3",
        "keys": [
          "Open GLB"
        ],
        "title": "Preview A Local Model",
        "description": "Preview a local .glb in Imported Models. Your library stays unchanged.",
        "kind": "button",
        "labelIds": [
          "openModel"
        ]
      }
    ]
  },
  {
    "title": "Model Editor · Selection",
    "icon": "mouse-pointer-2",
    "rows": [
      {
        "id": "mouse-pointer-2-0",
        "keys": [
          "Edit Model"
        ],
        "title": "Open / Close Editing",
        "description": "Click to start or stop editing.",
        "kind": "button",
        "labelIds": [
          "editModel",
          "closeEditor"
        ]
      },
      {
        "id": "mouse-pointer-2-1",
        "keys": [
          "Item"
        ],
        "title": "Select A Whole Object",
        "description": "Select all parts of an item together.",
        "kind": "button",
        "labelIds": [
          "selectItem"
        ]
      },
      {
        "id": "mouse-pointer-2-2",
        "keys": [
          "Element"
        ],
        "title": "Select A Single Part",
        "description": "Select one part to edit separately.",
        "kind": "button",
        "labelIds": [
          "selectPart"
        ]
      },
      {
        "id": "mouse-pointer-2-3",
        "keys": [
          "Click"
        ],
        "title": "Click To Select",
        "description": "Uses the current selection mode.",
        "kind": "gesture"
      },
      {
        "id": "mouse-pointer-2-4",
        "keys": [
          "Click Outside"
        ],
        "title": "Click Empty Space To Deselect",
        "description": "Clears the highlight and transform handles.",
        "kind": "gesture"
      },
      {
        "id": "mouse-pointer-2-5",
        "keys": [
          "Esc"
        ],
        "title": "Deselect",
        "description": "Clears the selection; your edits stay unchanged.",
        "kind": "keyboard"
      },
      {
        "id": "mouse-pointer-2-6",
        "keys": [
          "Filter Parts"
        ],
        "title": "Filter Parts",
        "description": "Type a name to narrow the part list.",
        "kind": "field",
        "icon": "search",
        "labelIds": [
          "filterParts"
        ]
      },
      {
        "id": "part-selector",
        "kind": "field",
        "icon": "panels",
        "keys": [
          "Selected Part"
        ],
        "labelIds": [
          "selectedPart"
        ],
        "title": "Select A Part",
        "description": "Choose from the filtered part list."
      }
    ]
  },
  {
    "title": "Move, Rotate & Resize",
    "icon": "move-3d",
    "rows": [
      {
        "id": "move-3d-0",
        "keys": [
          "W"
        ],
        "title": "Move",
        "description": "Drag an axis handle to change position.",
        "kind": "keyboard"
      },
      {
        "id": "move-3d-1",
        "keys": [
          "E"
        ],
        "title": "Rotate",
        "description": "Drag a rotation handle to change the angle.",
        "kind": "keyboard"
      },
      {
        "id": "move-3d-2",
        "keys": [
          "R"
        ],
        "title": "Resize",
        "description": "Drag a scale handle to change size.",
        "kind": "keyboard"
      },
      {
        "id": "move-3d-3",
        "keys": [
          "X / Y / Z"
        ],
        "title": "Precise Adjustments",
        "description": "Enter Position, Rotation (degrees), or Scale for a selected part.",
        "kind": "field",
        "icon": "sliders-horizontal"
      },
      {
        "id": "move-3d-4",
        "keys": [
          "Duplicate"
        ],
        "title": "Duplicate Part",
        "description": "Copies the selected part in Select Part mode.",
        "kind": "button",
        "labelIds": [
          "duplicatePart"
        ]
      },
      {
        "id": "move-3d-5",
        "keys": [
          "Remove"
        ],
        "title": "Remove Part",
        "description": "Removes the selected part from your edit.",
        "kind": "button",
        "labelIds": [
          "removePart"
        ]
      },
      {
        "id": "move-3d-6",
        "keys": [
          "Reset Part"
        ],
        "title": "Restore The Part Transform",
        "description": "Restores its saved Position, Rotation, and Scale.",
        "kind": "button",
        "labelIds": [
          "resetPart"
        ]
      }
    ]
  },
  {
    "title": "Color & Materials",
    "icon": "palette",
    "rows": [
      { "id": "material-color", "keys": ["Color Picker"], "kind": "field", "icon": "palette", "title": "Change The Selected Color", "description": "Use the square, Hue, and Brightness to recolor an item or part." },
      { "id": "material-values", "keys": ["Hex / RGB"], "kind": "field", "icon": "sliders-horizontal", "title": "Enter An Exact Color", "description": "Type a Hex value or RGB channels. Existing textures stay visible." },
      { "id": "material-reset", "keys": ["Reset Color"], "kind": "button", "title": "Restore The Source Color", "description": "Resets the selected material's color. Save Model applies your edits." }
    ]
  },
  {
    "title": "Saving & Edit History",
    "icon": "save",
    "rows": [
      {
        "id": "save-0",
        "keys": [
          "Save Model"
        ],
        "title": "Apply Your Edits",
        "description": "Individual saves also update their rack or prop set.",
        "kind": "button",
        "labelIds": [
          "save"
        ]
      },
      {
        "id": "save-2",
        "keys": [
          "Previous Save"
        ],
        "title": "Previous Save",
        "description": "Restore the previous saved model when available.",
        "kind": "button",
        "labelIds": [
          "previousSave"
        ]
      },
      {
        "id": "save-next",
        "keys": [
          "Next Save"
        ],
        "title": "Next Save",
        "description": "Return to the later version after using Previous Save.",
        "kind": "button",
        "labelIds": [
          "nextSave"
        ]
      },
      {
        "id": "save-1",
        "keys": [
          "Original"
        ],
        "title": "Show Original / Show Changes",
        "description": "Compare the original model with your current edits.",
        "kind": "button",
        "labelIds": [
          "showOriginal",
          "showChanges"
        ]
      },
      {
        "id": "save-3",
        "keys": [
          "Ctrl",
          "Z"
        ],
        "title": "Undo",
        "description": "Reverts the last edit in the current model.",
        "kind": "keyboard"
      },
      {
        "id": "save-4",
        "keys": [
          "Ctrl",
          "Shift",
          "Z"
        ],
        "title": "Redo",
        "description": "Restores an edit you just undid.",
        "kind": "keyboard"
      },
      {
        "id": "save-5",
        "keys": [
          "Ctrl",
          "C"
        ],
        "title": "Copy Selected Part",
        "description": "Stores the selected part for pasting.",
        "kind": "keyboard"
      },
      {
        "id": "save-6",
        "keys": [
          "Ctrl",
          "V"
        ],
        "title": "Paste As A Duplicate",
        "description": "Pastes a new copy in the same asset version.",
        "kind": "keyboard"
      },
      {
        "id": "save-7",
        "keys": [
          "Ctrl",
          "B"
        ],
        "title": "Duplicate Selected Part",
        "description": "Creates a copy of the selected part.",
        "kind": "keyboard"
      },
      {
        "id": "save-location",
        "keys": [
          "Save Location"
        ],
        "title": "Where Your Edits Are Saved",
        "description": "Hosted site: this browser. Local editor: model files and backups.",
        "kind": "field",
        "icon": "save"
      }
    ]
  },
  {
    "title": "Workspace Panels",
    "icon": "panels",
    "rows": [
      {
        "id": "panel-move",
        "keys": [
          "Header Drag"
        ],
        "title": "Move A Panel",
        "description": "Drag the panel heading to reposition it.",
        "kind": "gesture"
      },
      {
        "id": "panel-collapse",
        "keys": [
          "−",
          "+"
        ],
        "title": "Collapse / Expand A Panel",
        "description": "Hides the panel contents while keeping its header.",
        "kind": "button",
        "labelIds": [
          null,
          null
        ]
      },
      {
        "id": "return",
        "keys": [
          "Back To Workshop"
        ],
        "labelIds": [
          "back"
        ],
        "title": "Return To The Main Workshop",
        "description": "Shown when a main-workshop link is available.",
        "kind": "button",
        "icon": "return"
      }
    ]
  }
];
export const controlHelpSections = sections.map(section => ({...section, rows: section.rows.map(row => ({...row, keys: row.labelIds ? row.labelIds.map((id,index) => controlLabels[id] || row.keys[index]) : row.keys}))}));
