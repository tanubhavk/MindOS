import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { v4 as uuidv4 } from "uuid";

export default function NodeCanvas() {
  const [nodes, setNodes] = useState(() => {
    const savedNodes = localStorage.getItem("mindOS_nodes");
    return savedNodes ? JSON.parse(savedNodes) : [];
  });
  const [connections, setConnections] = useState(() => {
    const savedConnections = localStorage.getItem("mindOS_connections");
    return savedConnections ? JSON.parse(savedConnections) : [];
  });
  const [input, setInput] = useState("");
  const [time, setTime] = useState("");
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [savedPlans, setSavedPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerPosition, setTimePickerPosition] = useState({ x: 0, y: 0 });
  const [selectedNodeForTime, setSelectedNodeForTime] = useState(null);
  const timePickerRef = useRef(null);

  // Load saved plans on component mount
  useEffect(() => {
    const samplePlans = {
      "Sample 1 - Morning Routine": {
        goals: [
          { text: "Review daily goals", time: "07:00" },
          { text: "Plan day ahead", time: "07:15" },
          { text: "Set priorities", time: "07:30" }
        ],
        actions: [
          { text: "Check emails", time: "08:00" },
          { text: "Morning standup", time: "08:30" },
          { text: "Team sync", time: "09:00" },
          { text: "Documentation update", time: "09:30" }
        ],
        hobbies: [
          { text: "Morning meditation", time: "06:30" },
          { text: "Quick walk", time: "10:00" }
        ],
        lastUpdated: new Date().toISOString()
      },
      "Sample 2 - Work Day": {
        goals: [
          { text: "Review sprint goals", time: "09:00" },
          { text: "Complete project milestone", time: "11:00" },
          { text: "Plan next sprint", time: "16:00" }
        ],
        actions: [
          { text: "Team standup", time: "09:30" },
          { text: "Code review", time: "10:30" },
          { text: "Client meeting", time: "13:30" },
          { text: "Documentation update", time: "15:00" }
        ],
        hobbies: [
          { text: "Coffee break", time: "10:00" },
          { text: "Lunch walk", time: "12:30" }
        ],
        lastUpdated: new Date().toISOString()
      },
      "Sample 3 - Weekend Plan": {
        goals: [
          { text: "Plan weekend tasks", time: "08:00" },
          { text: "Review weekly goals", time: "09:00" },
          { text: "Set next week's goals", time: "16:00" }
        ],
        actions: [
          { text: "Grocery shopping", time: "10:00" },
          { text: "House cleaning", time: "11:30" },
          { text: "Meal prep", time: "14:00" }
        ],
        hobbies: [
          { text: "Morning yoga", time: "07:00" },
          { text: "Reading time", time: "13:00" },
          { text: "Evening walk", time: "17:00" }
        ],
        lastUpdated: new Date().toISOString()
      }
    };

    const savedPlansData = localStorage.getItem("mindOS_savedPlans");
    if (!savedPlansData) {
      // Only set sample plans if no plans exist
      setSavedPlans(samplePlans);
      localStorage.setItem("mindOS_savedPlans", JSON.stringify(samplePlans));
    } else {
      setSavedPlans(JSON.parse(savedPlansData));
    }
  }, []);

  // Save to localStorage whenever nodes or connections change
  useEffect(() => {
    localStorage.setItem("mindOS_nodes", JSON.stringify(nodes));
    localStorage.setItem("mindOS_connections", JSON.stringify(connections));
  }, [nodes, connections]);

  const handleAddNode = () => {
    if (!input) return;
    
    // Get the canvas dimensions and scroll position
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft;
    const scrollTop = canvas.scrollTop;
    
    // Calculate center position relative to the visible area
    const centerX = (canvasRect.width / 2) + scrollLeft - 100; // Subtract half of node width
    const centerY = (canvasRect.height / 2) + scrollTop - 30;  // Subtract half of node height

    // Get existing nodes at current time
    const existingNodesAtTime = nodes.filter(node => node.time === time);
    
    // If there are existing nodes at this time, offset the new node
    const offsetX = existingNodesAtTime.length * 120; // 120px spacing between nodes
    
    const newNode = {
      id: uuidv4(),
      text: input,
      time: time || new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      x: centerX + offsetX,
      y: centerY,
    };
    
    setNodes([...nodes, newNode]);
    setInput("");
    setTime("");
    
    // Scroll the new node into view if needed
    canvas.scrollTo({
      left: centerX + offsetX - (canvasRect.width / 2) + 100,
      top: centerY - (canvasRect.height / 2) + 30,
      behavior: 'smooth'
    });
  };

  // Add a keyboard shortcut for adding nodes
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && (input || time)) {
        handleAddNode();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [input, time]);

  const handleDrag = (e, data, id) => {
    requestAnimationFrame(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === id ? { ...node, x: data.x, y: data.y } : node
        )
      );
    });
  };

  const handleClickNode = (e, id) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedNodes((prev) => {
        const updated = [...prev, id].slice(-2);
        if (updated.length === 2) {
          const [from, to] = updated;
          const exists = connections.some(
            (conn) =>
              (conn.from === from && conn.to === to) ||
              (conn.from === to && conn.to === from)
          );
          if (!exists) {
            setConnections((prevConnections) => [
              ...prevConnections,
              { from, to },
            ]);
          }
          return [];
        }
        return updated;
      });
    } else {
      setSelectedNodes([id]);
    }
  };

  const resetPositions = () => {
    // Sort nodes by time
    const sortedNodes = [...nodes].sort((a, b) => {
      const timeA = a.time ? new Date(`2000-01-01T${a.time}`).getTime() : 0;
      const timeB = b.time ? new Date(`2000-01-01T${b.time}`).getTime() : 0;
      return timeA - timeB;
    });

    // Get canvas dimensions
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Set spacing and starting position
    const nodeWidth = 70; // Smaller node width
    const nodeHeight = 45; // Smaller node height
    const horizontalGap = 30; // Gap between nodes
    const verticalGap = 30; // Vertical gap
    const totalHorizontalSpacing = nodeWidth + horizontalGap;
    const totalVerticalSpacing = nodeHeight + verticalGap;
    
    // Calculate how many nodes can fit in a row
    const nodesPerRow = Math.floor((canvasRect.width - 100) / totalHorizontalSpacing) || 1;
    
    // Calculate total grid dimensions
    const numRows = Math.ceil(sortedNodes.length / nodesPerRow);
    const totalGridWidth = Math.min(nodesPerRow, sortedNodes.length) * totalHorizontalSpacing - horizontalGap;
    const totalGridHeight = numRows * totalVerticalSpacing - verticalGap;
    
    // Calculate starting position to center the grid
    const startX = (canvasRect.width - totalGridWidth) / 2;
    const startY = (canvasRect.height - totalGridHeight) / 2;
    
    // Position nodes in a centered grid
    const repositionedNodes = sortedNodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      
      return {
        ...node,
        x: startX + (col * totalHorizontalSpacing),
        y: Math.max(50, startY + (row * totalVerticalSpacing)) // Ensure minimum top margin
      };
    });

    setNodes(repositionedNodes);
    
    // Create connections between consecutive nodes
    const newConnections = [];
    for (let i = 0; i < repositionedNodes.length - 1; i++) {
      newConnections.push({
        from: repositionedNodes[i].id,
        to: repositionedNodes[i + 1].id
      });
    }
    setConnections(newConnections);

    // Scroll to show the centered layout
    const scrollLeft = Math.max(0, startX - 50);
    const scrollTop = Math.max(0, startY - 50);
    
    canvas.scrollTo({
      left: scrollLeft,
      top: scrollTop,
      behavior: 'smooth'
    });
  };

  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the canvas? This cannot be undone.")) {
      setNodes([]);
      setConnections([]);
      setSelectedNodes([]);
    }
  };

  const getNodeById = (id) => nodes.find((node) => node.id === id);

  const getTaskSequence = () => {
    const adj = {};
    const inDegree = {};

    nodes.forEach((node) => {
      adj[node.id] = [];
      inDegree[node.id] = 0;
    });

    connections.forEach(({ from, to }) => {
      adj[from].push(to);
      inDegree[to]++;
    });

    const queue = [];
    for (let id in inDegree) {
      if (inDegree[id] === 0) queue.push(id);
    }

    const result = [];
    while (queue.length > 0) {
      const current = queue.shift();
      const node = getNodeById(current);
      if (node) result.push(node);
      adj[current].forEach((neighbor) => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) queue.push(neighbor);
      });
    }

    return result;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        setNodes((prevNodes) =>
          prevNodes.filter((node) => !selectedNodes.includes(node.id))
        );
        setConnections((prevConnections) =>
          prevConnections.filter(
            (conn) =>
              !selectedNodes.includes(conn.from) &&
              !selectedNodes.includes(conn.to)
          )
        );
        setSelectedNodes([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodes]);

  // Add this new function to create nodes from a plan
  const createNodesFromPlan = (plan) => {
    // Clear existing nodes and connections
    setNodes([]);
    setConnections([]);
    
    // Combine all tasks from the plan
    const allTasks = [
      ...plan.goals.map(task => ({ ...task, type: 'goal' })),
      ...plan.actions.map(task => ({ ...task, type: 'action' })),
      ...plan.hobbies.map(task => ({ ...task, type: 'hobby' }))
    ];
    
    // Sort tasks by time
    const sortedTasks = allTasks.sort((a, b) => {
      const timeA = a.time ? new Date(`2000-01-01T${a.time}`).getTime() : 0;
      const timeB = b.time ? new Date(`2000-01-01T${b.time}`).getTime() : 0;
      return timeA - timeB;
    });

    // Get canvas dimensions
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Set spacing
    const nodeWidth = 70; // Width of each node
    const horizontalGap = 50; // Gap between nodes
    const totalSpacing = nodeWidth + horizontalGap;
    
    // Calculate total width needed
    const totalWidth = sortedTasks.length * totalSpacing;
    
    // Calculate starting position to center the chain
    const startX = Math.max(50, (canvasRect.width - totalWidth) / 2);
    const centerY = canvasRect.height / 2;
    
    // Create nodes in a horizontal chain
    const newNodes = sortedTasks.map((task, index) => ({
      id: uuidv4(),
      text: task.text,
      time: task.time,
      type: task.type,
      x: startX + (index * totalSpacing),
      y: centerY - 25 // Subtract half of node height to center vertically
    }));
    
    // Create connections between consecutive nodes
    const newConnections = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newConnections.push({
        from: newNodes[i].id,
        to: newNodes[i + 1].id
      });
    }
    
    // Update state
    setNodes(newNodes);
    setConnections(newConnections);
    
    // Scroll to show the centered layout
    requestAnimationFrame(() => {
      const scrollLeft = Math.max(0, startX - canvasRect.width / 4);
      canvas.scrollTo({
        left: scrollLeft,
        top: Math.max(0, centerY - canvasRect.height / 2),
        behavior: 'smooth'
      });
    });
  };

  // Update the plan selection handler
  useEffect(() => {
    if (selectedPlan && savedPlans[selectedPlan]) {
      createNodesFromPlan(savedPlans[selectedPlan]);
    }
  }, [selectedPlan, savedPlans]);

  // Handle node editing
  const handleDoubleClick = (e, node) => {
    e.stopPropagation();
    setEditingNode({
      ...node,
      newText: node.text,
      newTime: node.time
    });
  };

  const handleEditSave = () => {
    if (!editingNode) return;

    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === editingNode.id
          ? { ...node, text: editingNode.newText, time: editingNode.newTime }
          : node
      )
    );
    setEditingNode(null);
  };

  // Handle drag selection
  const handleCanvasMouseDown = (e) => {
    // Only start selection if clicking directly on the canvas background
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft || 0;
      const scrollTop = canvasRef.current.scrollTop || 0;
      
      const x = e.clientX - rect.left + scrollLeft;
      const y = e.clientY - rect.top + scrollTop;
      
      setIsDragging(true);
      setDragStart({ x, y });
      setSelectionBox({
        left: x,
        top: y,
        width: 0,
        height: 0
      });
      
      // Only clear selection if not holding shift
      if (!e.shiftKey) {
        setSelectedNodes([]);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft || 0;
    const scrollTop = canvasRef.current.scrollTop || 0;
    
    const currentX = e.clientX - rect.left + scrollLeft;
    const currentY = e.clientY - rect.top + scrollTop;

    const newSelectionBox = {
      left: Math.min(dragStart.x, currentX),
      top: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y)
    };

    setSelectionBox(newSelectionBox);

    // Select nodes that intersect with the selection box
    const selectedIds = nodes.filter(node => {
      const nodeRect = {
        left: node.x,
        top: node.y,
        right: node.x + 80, // Node width
        bottom: node.y + 45 // Node height
      };

      return (
        nodeRect.left < newSelectionBox.left + newSelectionBox.width &&
        nodeRect.right > newSelectionBox.left &&
        nodeRect.top < newSelectionBox.top + newSelectionBox.height &&
        nodeRect.bottom > newSelectionBox.top
      );
    }).map(node => node.id);

    // Update selection, preserving previous selection if shift is held
    setSelectedNodes(prev => {
      if (e.shiftKey) {
        return [...new Set([...prev, ...selectedIds])];
      }
      return selectedIds;
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setSelectionBox(null);
  };

  // Add event listeners for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        setSelectionBox(null);
      }
    };

    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseup', handleCanvasMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging, dragStart]);

  // Generate time options
  const generateTimeOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) => 
      i.toString().padStart(2, '0')
    );
    const minutes = Array.from({ length: 60 }, (_, i) => 
      i.toString().padStart(2, '0')
    );
    return { hours, minutes };
  };

  const { hours, minutes } = generateTimeOptions();

  // Handle time selection
  const handleTimeClick = (node, e) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    setTimePickerPosition({ 
      x: rect.left, 
      y: rect.bottom + window.scrollY 
    });
    setSelectedNodeForTime(node);
    setShowTimePicker(true);
  };

  const handleTimeSelect = (hour, minute, period) => {
    if (selectedNodeForTime) {
      const newTime = `${hour}:${minute}`;
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === selectedNodeForTime.id
            ? { ...node, time: newTime }
            : node
        )
      );
    }
    setShowTimePicker(false);
    setSelectedNodeForTime(null);
  };

  // Close time picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timePickerRef.current && !timePickerRef.current.contains(e.target)) {
        setShowTimePicker(false);
        setSelectedNodeForTime(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Side */}
      <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
        <div className="toolbar" style={{ 
          padding: "0.5rem", 
          gap: "0.5rem", 
          display: "flex", 
          alignItems: "center", 
          borderBottom: "1px solid rgba(204, 204, 204, 0.3)",
          background: "white",
          zIndex: 10
        }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter node text"
            style={{
              padding: "0.5rem",
              fontSize: "0.8rem",
              height: "32px",
              borderRadius: "4px",
              border: "1px solid rgba(204, 204, 204, 0.5)",
              flex: 1
            }}
          />
          <input
            type="time"
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              width: "100px",
              padding: "0.5rem",
              fontSize: "0.8rem",
              height: "32px",
              borderRadius: "4px",
              border: "1px solid rgba(204, 204, 204, 0.5)"
            }}
          />
          <button 
            className="button" 
            onClick={handleAddNode}
            style={{ 
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              height: "32px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Add Node
          </button>
          <button 
            className="button" 
            onClick={resetPositions}
            style={{ 
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              height: "32px",
              background: "#f3f4f6",
              border: "1px solid rgba(204, 204, 204, 0.5)",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Reset Positions
          </button>
          <button 
            className="button" 
            onClick={clearCanvas}
            style={{ 
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              height: "32px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Clear Canvas
          </button>
        </div>

        <div 
          className="canvas" 
          ref={canvasRef} 
          style={{ 
            flex: 1, 
            position: "relative",
            overflow: "auto",
            padding: "1rem",
            minWidth: "100%",
            minHeight: "100%",
            cursor: isDragging ? "crosshair" : "default",
            userSelect: "none" // Prevent text selection while dragging
          }}
        >
          {/* Selection Box */}
          {selectionBox && (
            <div style={{
              position: 'absolute',
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
              border: '1.5px solid rgba(59, 130, 246, 0.8)',
              background: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000
            }} />
          )}

          <svg className="connection-lines" style={{ 
            position: "absolute", 
            width: "100%", 
            height: "100%",
            pointerEvents: "none",
            zIndex: 1
          }}>
            {connections.map(({ from, to }, index) => {
              const fromNode = getNodeById(from);
              const toNode = getNodeById(to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + 40;
              const y1 = fromNode.y + 25;
              const x2 = toNode.x + 40;
              const y2 = toNode.y + 25;

              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              const shorten = 20;

              const sx = x1 + (dx / len) * shorten;
              const sy = y1 + (dy / len) * shorten;
              const ex = x2 - (dx / len) * shorten;
              const ey = y2 - (dy / len) * shorten;

              return (
                <g key={index}>
                  <line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke="#666666"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                  <circle
                    cx={ex}
                    cy={ey}
                    r={2.5}
                    fill="#666666"
                  />
                </g>
              );
            })}
          </svg>

          {/* Time Picker Dropdown */}
          {showTimePicker && (
            <div
              ref={timePickerRef}
              style={{
                position: 'absolute',
                left: `${timePickerPosition.x}px`,
                top: `${timePickerPosition.y}px`,
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                display: 'flex',
                padding: '8px',
                gap: '8px'
              }}
            >
              {/* Hours */}
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {hours.map(hour => (
                  <button
                    key={hour}
                    onClick={() => handleTimeSelect(hour, '00')}
                    style={{
                      padding: '4px 8px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      ':hover': {
                        background: 'rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    {hour}
                  </button>
                ))}
              </div>

              {/* Minutes */}
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
                paddingLeft: '8px'
              }}>
                {minutes.map(minute => (
                  <button
                    key={minute}
                    onClick={() => handleTimeSelect(selectedNodeForTime?.time?.split(':')[0] || '00', minute)}
                    style={{
                      padding: '4px 8px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      ':hover': {
                        background: 'rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          )}

          {nodes.map((node) => (
            <Draggable
              key={node.id}
              bounds="parent"
              position={{ x: node.x, y: node.y }}
              onDrag={(e, data) => handleDrag(e, data, node.id)}
              disabled={editingNode?.id === node.id}
              onStart={(e) => {
                // Prevent drag selection when starting to drag a node
                e.stopPropagation();
              }}
            >
              <div
                className={`node ${selectedNodes.includes(node.id) ? "selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.shiftKey) {
                    setSelectedNodes(prev => 
                      prev.includes(node.id) 
                        ? prev.filter(id => id !== node.id)
                        : [...prev, node.id]
                    );
                  } else {
                    handleClickNode(e, node.id);
                  }
                }}
                onDoubleClick={(e) => handleDoubleClick(e, node)}
                style={{
                  position: "absolute",
                  width: "auto",
                  minWidth: "80px",
                  maxWidth: "120px",
                  minHeight: "45px",
                  padding: "0.5rem",
                  background: selectedNodes.includes(node.id)
                    ? 'rgba(59, 130, 246, 0.15)'
                    : (node.type === 'goal' ? 'rgba(34, 197, 94, 0.08)' :
                       node.type === 'action' ? 'rgba(59, 130, 246, 0.08)' :
                       'rgba(234, 179, 8, 0.08)'),
                  borderRadius: "6px",
                  border: `1.5px solid ${
                    selectedNodes.includes(node.id)
                      ? 'rgba(59, 130, 246, 0.5)'
                      : (node.type === 'goal' ? 'rgba(34, 197, 94, 0.2)' :
                         node.type === 'action' ? 'rgba(59, 130, 246, 0.2)' :
                         'rgba(234, 179, 8, 0.2)')
                  }`,
                  cursor: editingNode?.id === node.id ? "default" : "move",
                  fontSize: "0.6rem",
                  userSelect: "none",
                  zIndex: selectedNodes.includes(node.id) ? 1000 : 2,
                  boxShadow: selectedNodes.includes(node.id)
                    ? "0 0 0 2px rgba(59, 130, 246, 0.3)"
                    : "0 1px 2px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  transition: "all 0.15s ease-in-out"
                }}
              >
                {/* Node Header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%",
                  marginBottom: "0.25rem"
                }}>
                  {/* Type Label */}
                  <div style={{
                    fontSize: "0.65rem",
                    color: node.type === 'goal' ? 'rgb(22, 163, 74)' :
                           node.type === 'action' ? 'rgb(37, 99, 235)' :
                           'rgb(202, 138, 4)',
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: "500",
                    opacity: 0.9
                  }}>
                    {node.type}
                  </div>
                  {/* Time Badge */}
                  <div
                    onClick={(e) => handleTimeClick(node, e)}
                    style={{
                      fontSize: "0.65rem",
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      background: "rgba(255, 255, 255, 0.5)",
                      padding: "0.1rem 0.25rem",
                      borderRadius: "3px",
                      border: "1px solid rgba(0, 0, 0, 0.05)",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      ':hover': {
                        background: "rgba(255, 255, 255, 0.8)"
                      }
                    }}
                  >
                    <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>🕒</span>
                    {node.time || "Set time"}
                  </div>
                </div>

                {editingNode?.id === node.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={editingNode.newText}
                      onChange={(e) => setEditingNode({
                        ...editingNode,
                        newText: e.target.value
                      })}
                      style={{
                        width: '100%',
                        fontSize: '0.7rem',
                        padding: '0.25rem',
                        border: '1px solid rgba(204, 204, 204, 0.5)',
                        borderRadius: '4px'
                      }}
                      autoFocus
                    />
                    <input
                      type="time"
                      value={editingNode.newTime || ''}
                      onChange={(e) => setEditingNode({
                        ...editingNode,
                        newTime: e.target.value
                      })}
                      style={{
                        width: '100%',
                        fontSize: '0.7rem',
                        padding: '0.25rem',
                        border: '1px solid rgba(204, 204, 204, 0.5)',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={handleEditSave}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.25rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div style={{
                    fontSize: "0.75rem",
                    color: "#333",
                    lineHeight: "1.3",
                    wordBreak: "break-word"
                  }}>
                    {node.text}
                  </div>
                )}
              </div>
            </Draggable>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        gap: "1rem", 
        padding: "1.5rem",
        paddingTop: "2rem", // Extra top padding to avoid navbar overlap
        maxHeight: "calc(100vh - 4rem)", // Account for top and bottom spacing
        overflow: "hidden",
        zIndex: 5,
        background: "white",
        borderLeft: "1px solid rgba(204, 204, 204, 0.3)",
        position: "relative" // For proper stacking context
      }}>
        {/* Task Sequence Section */}
        <div style={{
          flex: 1,
          padding: "2rem",
          background: "rgba(247, 247, 247, 0.7)",
          overflowY: "auto",
          backdropFilter: "blur(4px)",
          borderRadius: "12px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}>
          <div style={{
            position: "sticky",
            top: 0,
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            border: "1px solid rgba(204, 204, 204, 0.3)",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
            backdropFilter: "blur(8px)",
            zIndex: 1
          }}>
            <h3 style={{ 
              fontSize: "1rem",
              fontWeight: "600",
              color: "#333",
              margin: 0
            }}>Task Sequence</h3>
          </div>
          <ol style={{ 
            paddingLeft: "2.25rem",
            paddingRight: "1rem",
            listStyleType: "decimal",
            listStylePosition: "outside",
            margin: 0,
            fontSize: "0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            {getTaskSequence().map((node) => (
              <li key={node.id} style={{ 
                marginBottom: "0.25rem",
                padding: "1rem 1.25rem",
                background: "rgba(255, 255, 255, 0.7)",
                borderRadius: "8px",
                border: "1px solid rgba(204, 204, 204, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
                cursor: "default",
                position: "relative"
              }}>
                <span style={{ 
                  color: "#333", 
                  flex: 1,
                  lineHeight: "1.5"
                }}>{node.text}</span>
                {node.time && (
                  <span style={{ 
                    color: "#666",
                    fontSize: "0.8rem",
                    padding: "4px 10px",
                    background: "rgba(255, 255, 255, 0.8)",
                    borderRadius: "6px",
                    border: "1px solid rgba(204, 204, 204, 0.2)",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span style={{ fontSize: "0.75rem" }}>🕒</span>
                    {node.time}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Saved Plans Section */}
        <div style={{
          flex: 1,
          padding: "1rem",
          background: "rgba(247, 247, 247, 0.7)",
          overflowY: "auto",
          backdropFilter: "blur(4px)",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.7)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "1rem",
            padding: "0.5rem",
            background: "rgba(255, 255, 255, 0.5)",
            borderRadius: "6px",
            border: "1px solid rgba(204, 204, 204, 0.3)"
          }}>
            <h3 style={{ 
              fontSize: "0.9rem",
              fontWeight: "600",
              color: "#333",
              margin: 0
            }}>Saved Plans</h3>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              style={{
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(204, 204, 204, 0.5)",
                background: "rgba(255, 255, 255, 0.9)",
                color: "#333",
                fontSize: "0.8rem",
                height: "24px"
              }}
            >
              <option value="">Select a plan</option>
              {Object.keys(savedPlans).map((planName) => (
                <option key={planName} value={planName}>
                  {planName}
                </option>
              ))}
            </select>
          </div>
          
          {Object.entries(savedPlans).length === 0 ? (
            <div style={{ 
              padding: "0.75rem",
              background: "rgba(255, 255, 255, 0.5)",
              borderRadius: "6px",
              border: "1px solid rgba(204, 204, 204, 0.3)",
              color: "#666",
              textAlign: "center",
              fontSize: "0.8rem"
            }}>
              No saved plans yet
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.8rem" }}>
              {Object.entries(savedPlans).map(([name, plan]) => (
                <li key={name} style={{ 
                  marginBottom: "0.5rem",
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "6px",
                  border: "1px solid rgba(204, 204, 204, 0.3)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "0.5rem"
                  }}>
                    <span style={{ fontWeight: "500" }}>{name}</span>
                    <span style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      padding: "2px 6px",
                      background: "rgba(255, 255, 255, 0.5)",
                      borderRadius: "4px",
                      border: "1px solid rgba(204, 204, 204, 0.2)"
                    }}>
                      {new Date(plan.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#666"
                  }}>
                    {[
                      { label: "Goals", count: plan.goals.length },
                      { label: "Actions", count: plan.actions.length },
                      { label: "Hobbies", count: plan.hobbies.length }
                    ].map(({ label, count }) => (
                      <div key={label} style={{
                        padding: "0.25rem",
                        background: "rgba(255, 255, 255, 0.3)",
                        borderRadius: "4px",
                        border: "1px solid rgba(204, 204, 204, 0.2)",
                        textAlign: "center"
                      }}>
                        <div style={{ fontWeight: "500" }}>{label}</div>
                        <div>{count}</div>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


// change the code and make it beautiful 