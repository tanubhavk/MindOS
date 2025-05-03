import React from "react";

export default function KeybindsAndRules({ onBack }) {
  return (
    <div style={{
      maxWidth: 600,
      margin: "2rem auto",
      padding: "2rem",
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      fontFamily: 'Inter, sans-serif',
      color: '#222',
    }}>
      <h2 style={{ marginBottom: "1.5rem", fontWeight: 700, fontSize: "1.5rem" }}>
        🖥️ NodeCanvas Keybinds & Rules
      </h2>
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: '#2563eb' }}>Rules & Behaviors</h3>
        <ul style={{ lineHeight: 1.8, fontSize: "1rem", paddingLeft: 0, listStyle: "none" }}>
          <li><b>Node Selection:</b> You can select up to <b>two nodes at a time</b> by clicking them. Clicking a selected node will unselect it. Selecting a third node will replace the selection with just that node.</li>
          <li><b>Deselect All:</b> Click the canvas background or press <b>Esc</b> to clear all selections.</li>
          <li><b>Connecting Nodes:</b> To connect nodes, select one node, then hold <b>Cmd (Mac) / Ctrl (Windows)</b> and click another node. A connection (arrow) will be created between them if one does not already exist. After connecting, only the second node remains selected for quick chaining.</li>
          <li><b>Lasso Selection:</b> Click and drag on the canvas background to draw a selection box. All nodes inside the box will be selected. Lasso selection is mainly for multi-edit and delete actions.</li>
          <li><b>Multi-Edit & Delete:</b> When multiple nodes are selected (via lasso or manual selection), use the toolbar to edit or delete all selected nodes at once.</li>
          <li><b>Delete:</b> Press <b>Delete</b> or <b>Backspace</b> to remove all selected nodes and their connections.</li>
          <li><b>Zoom:</b> Use <b>Cmd/Ctrl + =</b> to zoom in, <b>Cmd/Ctrl + -</b> to zoom out, and <b>Cmd/Ctrl + 0</b> to reset zoom. You can also use the toolbar buttons or mouse/trackpad.</li>
          <li><b>Hide/Show Arrows:</b> Use the toolbar toggle to hide or show connection arrows between nodes. This does not delete the connections.</li>
          <li><b>Reset Positions:</b> Use the toolbar button to auto-arrange all nodes in a grid.</li>
          <li><b>Clear Canvas:</b> Use the toolbar button to remove all nodes and connections.</li>
          <li><b>Edit Node:</b> Double-click a node to edit its text and time.</li>
          <li><b>Move Node:</b> Drag a node to reposition it on the canvas.</li>
        </ul>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Keyboard Shortcuts</h3>
        <ul style={{ lineHeight: 1.8, fontSize: "1rem", paddingLeft: 0, listStyle: "none" }}>
          <li><b>Delete/Backspace</b>: Delete selected node(s)</li>
          <li><b>Esc</b>: Deselect all nodes</li>
          <li><b>Cmd/Ctrl + =</b>: Zoom in</li>
          <li><b>Cmd/Ctrl + -</b>: Zoom out</li>
          <li><b>Cmd/Ctrl + 0</b>: Reset zoom</li>
          <li><b>Enter</b>: Add node (when input is focused)</li>
        </ul>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Mouse & Selection Rules</h3>
        <ul style={{ lineHeight: 1.8, fontSize: "1rem", paddingLeft: 0, listStyle: "none" }}>
          <li><b>Click node</b>: Select or unselect (max 2 at a time)</li>
          <li><b>Click canvas background</b>: Deselect all</li>
          <li><b>Click and drag on canvas</b>: Lasso select multiple nodes</li>
          <li><b>Drag node</b>: Move node</li>
          <li><b>Double-click node</b>: Edit node</li>
          <li><b>Cmd/Ctrl + Click another node (when one is selected)</b>: Connect nodes</li>
        </ul>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Other Features</h3>
        <ul style={{ lineHeight: 1.8, fontSize: "1rem", paddingLeft: 0, listStyle: "none" }}>
          <li><b>Zoom controls</b>: Use toolbar buttons or keybinds</li>
          <li><b>Hide/Show arrows</b>: Toolbar toggle</li>
          <li><b>Multi-edit</b>: Select nodes, then use toolbar to edit/delete</li>
          <li><b>Reset positions</b>: Toolbar button</li>
          <li><b>Clear canvas</b>: Toolbar button</li>
        </ul>
      </section>
      {onBack && (
        <button onClick={onBack} style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)"
        }}>
          ← Back to Canvas
        </button>
      )}
    </div>
  );
} 