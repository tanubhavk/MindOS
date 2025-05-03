import React, { useState, useRef, useEffect, useCallback } from "react";
import Draggable from "react-draggable";
import { v4 as uuidv4 } from "uuid";

// Inject global CSS for hiding scrollbars
if (typeof document !== 'undefined' && !document.getElementById('hide-scrollbar-style')) {
  const style = document.createElement('style');
  style.id = 'hide-scrollbar-style';
  style.innerHTML = `.hide-scrollbar::-webkit-scrollbar { display: none !important; }`;
  document.head.appendChild(style);
}

export default function NodeCanvas() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("mindOS_theme");
    return savedTheme === "dark";
  });
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
  const canvasRef = useRef(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerPosition, setTimePickerPosition] = useState({ x: 0, y: 0 });
  const [selectedNodeForTime, setSelectedNodeForTime] = useState(null);
  const timePickerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [showArrows, setShowArrows] = useState(true);
  const [isMultiEditing, setIsMultiEditing] = useState(false);
  const [multiEditText, setMultiEditText] = useState("");
  const [multiEditTime, setMultiEditTime] = useState("");
  const [history, setHistory] = useState([]);

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

  // Push to history on every nodes/connections change
  useEffect(() => {
    setHistory(prev => [...prev, { nodes, connections }]);
    // eslint-disable-next-line
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

  // Update the handleDrag function for smoother dragging
  const handleDrag = useCallback((e, data, id) => {
    e.stopPropagation(); // Prevent canvas drag events while dragging nodes
    
    setNodes(prevNodes => {
      // Find the dragged node
      const draggedNodeIndex = prevNodes.findIndex(node => node.id === id);
      if (draggedNodeIndex === -1) return prevNodes;
      
      // Create a new array with the updated node position
      const newNodes = [...prevNodes];
      const canvas = canvasRef.current;
      if (!canvas) return prevNodes;
      
      const canvasRect = canvas.getBoundingClientRect();
      const maxX = canvasRect.width - 80; // Account for node width
      const maxY = canvasRect.height - 45; // Account for node height
      
      newNodes[draggedNodeIndex] = {
        ...newNodes[draggedNodeIndex],
        x: Math.max(0, Math.min(data.x, maxX)),
        y: Math.max(0, Math.min(data.y, maxY))
      };
      
      return newNodes;
    });
  }, []);

  // Update the handleDragStart function
  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    // Disable text selection during drag
    document.body.style.userSelect = 'none';
    // Disable pointer events on connections during drag
    const svg = document.querySelector('.connection-lines');
    if (svg) svg.style.pointerEvents = 'none';
    
    // Add smooth transition class to the node being dragged
    const node = e.target.closest('.node');
    if (node) {
      node.style.transition = 'none';
    }
  }, []);

  // Update the handleDragStop function
  const handleDragStop = useCallback((e) => {
    e.stopPropagation();
    // Re-enable text selection
    document.body.style.userSelect = '';
    // Re-enable pointer events on connections
    const svg = document.querySelector('.connection-lines');
    if (svg) svg.style.pointerEvents = '';
    
    // Remove smooth transition class from the node
    const node = e.target.closest('.node');
    if (node) {
      node.style.transition = 'all 0.15s ease-in-out';
    }
  }, []);

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

  // Add zoom handler
  const handleZoom = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // Check if the event is from a trackpad by looking at the deltaMode
      // deltaMode 0 is typically used for precise scrolling devices like trackpads
      const isTrackpad = e.deltaMode === 0;
      
      // Increase zoom factors by 10%
      const zoomFactor = isTrackpad ? 0.0045 : 0.055;
      const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
      
      // Apply zoom change more gradually and ensure it stays within bounds
      const newZoom = Math.min(Math.max(zoom + delta, 0.1), 3);
      
      // Get mouse position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return; // Guard against null canvas reference
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setZoom(newZoom);
    }
  }, [zoom]);

  // Add keyboard shortcuts for zooming
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault();
        setZoom(prev => Math.min(prev + 0.055, 3));
      } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        setZoom(prev => Math.max(prev - 0.055, 0.1));
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Deselect all on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedNodes([]);
        setEditingNode(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Add wheel event listener for zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      handleZoom(e);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleZoom]);

  // Update the canvas style
  const canvasStyle = {
    flex: 1,
    position: "relative",
    overflow: "auto",
    padding: "1rem",
    minWidth: "100%",
    minHeight: "100%",
    cursor: "default",
    userSelect: "none"
  };

  // Update the content container style
  const contentStyle = {
    position: "relative",
    transform: `scale(${zoom})`,
    transformOrigin: "0 0",
    transition: "transform 0.1s ease-out",
    width: "fit-content",
    height: "fit-content",
    minWidth: "100%",
    minHeight: "100%"
  };

  // Update the getNodeStyle function to include dark mode text and more opaque backgrounds
  const getNodeStyle = (node, isSelected) => ({
    position: "absolute",
    width: "auto",
    minWidth: "80px",
    maxWidth: "120px",
    minHeight: "45px",
    padding: "0.5rem",
    background: isSelected
      ? isDarkMode 
        ? 'rgba(59, 130, 246, 0.5)'
        : 'rgba(59, 130, 246, 0.15)'
      : (node.type === 'goal' 
          ? isDarkMode 
            ? 'rgba(34, 197, 94, 0.35)'
            : 'rgba(34, 197, 94, 0.08)'
          : node.type === 'action' 
            ? isDarkMode 
              ? 'rgba(59, 130, 246, 0.35)'
              : 'rgba(59, 130, 246, 0.08)'
            : isDarkMode 
              ? 'rgba(234, 179, 8, 0.35)'
              : 'rgba(234, 179, 8, 0.08)'),
    borderRadius: "6px",
    border: `1.5px solid ${
      isSelected
        ? isDarkMode 
          ? 'rgba(59, 130, 246, 0.7)'
          : 'rgba(59, 130, 246, 0.5)'
        : (node.type === 'goal' 
            ? isDarkMode 
              ? 'rgba(34, 197, 94, 0.4)'
              : 'rgba(34, 197, 94, 0.2)'
            : node.type === 'action' 
              ? isDarkMode 
                ? 'rgba(59, 130, 246, 0.4)'
                : 'rgba(59, 130, 246, 0.2)'
              : isDarkMode 
                ? 'rgba(234, 179, 8, 0.4)'
                : 'rgba(234, 179, 8, 0.2)')
    }`,
    cursor: editingNode?.id === node.id ? "default" : "move",
    fontSize: `${0.6 / zoom}rem`,
    userSelect: "none",
    zIndex: isSelected ? 1000 : 2,
    boxShadow: isSelected
      ? isDarkMode 
        ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
        : "0 0 0 2px rgba(59, 130, 246, 0.3)"
      : isDarkMode 
        ? "0 1px 2px rgba(0,0,0,0.2)"
        : "0 1px 2px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    transition: "all 0.15s ease-in-out",
    willChange: "transform",
    touchAction: "none",
    transform: `translate3d(0, 0, 0)`,
    backfaceVisibility: "hidden",
    perspective: "1000px",
    color: isDarkMode ? "#fff" : "#333"
  });

  // Update the ZoomControls component
  const ZoomControls = () => (
    <div style={{
      position: "absolute",
      bottom: "20px",
      right: "320px",
      display: "flex",
      gap: "8px",
      padding: "8px",
      background: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 1000
    }}>
      <button
        onClick={() => setZoom(prev => Math.max(prev - 0.055, 0.1))}
        style={{
          padding: "4px 8px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        -
      </button>
      <span style={{ padding: "4px 8px" }}>
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(prev => Math.min(prev + 0.055, 3))}
        style={{
          padding: "4px 8px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        +
      </button>
      <button
        onClick={() => setZoom(1)}
        style={{
          padding: "4px 8px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Reset
      </button>
    </div>
  );

  // Add function to handle multi-edit
  const handleMultiEdit = () => {
    if (selectedNodes.length === 0) return;
    
    setIsMultiEditing(true);
    // Set initial values from the first selected node
    const firstNode = nodes.find(node => node.id === selectedNodes[0]);
    if (firstNode) {
      setMultiEditText(firstNode.text);
      setMultiEditTime(firstNode.time || "");
    }
  };

  // Add function to save multi-edit
  const handleMultiEditSave = () => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        selectedNodes.includes(node.id)
          ? {
              ...node,
              text: multiEditText,
              time: multiEditTime || node.time
            }
          : node
      )
    );
    setIsMultiEditing(false);
    setMultiEditText("");
    setMultiEditTime("");
  };

  // Add function to handle multi-delete
  const handleMultiDelete = () => {
    if (selectedNodes.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedNodes.length} selected nodes?`)) {
      setNodes(prevNodes => prevNodes.filter(node => !selectedNodes.includes(node.id)));
      setConnections(prevConnections =>
        prevConnections.filter(
          conn => !selectedNodes.includes(conn.from) && !selectedNodes.includes(conn.to)
        )
      );
      setSelectedNodes([]);
    }
  };

  // Undo handler (Cmd+Z or Ctrl+Z)
  useEffect(() => {
    const handleUndo = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        setHistory(prev => {
          if (prev.length < 2) return prev;
          const newHistory = prev.slice(0, -1);
          const last = newHistory[newHistory.length - 1];
          setNodes(last.nodes);
          setConnections(last.connections);
          return newHistory;
        });
      }
    };
    window.addEventListener('keydown', handleUndo);
    return () => window.removeEventListener('keydown', handleUndo);
  }, []);

  // Add theme toggle handler
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem("mindOS_theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  // Add theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Update the navbar (if present) to use dark background and light text in dark mode
  useEffect(() => {
    const navbar = document.querySelector('.navbar, nav, header');
    if (navbar) {
      if (isDarkMode) {
        navbar.style.background = '#23272f';
        navbar.style.color = '#fff';
      } else {
        navbar.style.background = '';
        navbar.style.color = '';
      }
    }
  }, [isDarkMode]);

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh",
      background: isDarkMode ? "#1a1a1a" : "#ffffff"
    }}>
      {/* Left Side */}
      <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
        <div className="toolbar" style={{ 
          padding: "0.5rem", 
          gap: "0.5rem", 
          display: "flex", 
          alignItems: "center", 
          borderBottom: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`,
          background: isDarkMode ? "#2d2d2d" : "white",
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
              border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(204, 204, 204, 0.5)"}`,
              background: isDarkMode ? "#3d3d3d" : "white",
              color: isDarkMode ? "#ffffff" : "#333",
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
              border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(204, 204, 204, 0.5)"}`,
              background: isDarkMode ? "#3d3d3d" : "white",
              color: isDarkMode ? "#ffffff" : "#333"
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
            onClick={() => setShowArrows((prev) => !prev)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              height: "32px",
              background: showArrows ? "#f3f4f6" : "#fee2e2",
              color: showArrows ? "#2563eb" : "#dc2626",
              border: showArrows ? "1px solid #2563eb33" : "1px solid #dc262633",
              borderRadius: "4px",
              cursor: "pointer",
              marginLeft: "0.5rem"
            }}
          >
            {showArrows ? "Hide Arrows" : "Show Arrows"}
          </button>

          {/* Multi-edit controls */}
          {selectedNodes.length > 0 && (
            <>
              <div style={{ 
                display: "flex", 
                gap: "0.5rem", 
                padding: "0 0.5rem", 
                borderLeft: "1px solid rgba(204, 204, 204, 0.3)",
                borderRight: "1px solid rgba(204, 204, 204, 0.3)"
              }}>
                <span style={{ 
                  fontSize: "0.8rem", 
                  color: "#666",
                  display: "flex",
                  alignItems: "center"
                }}>
                  {selectedNodes.length} selected
                </span>
                <button 
                  onClick={handleMultiEdit}
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
                  Edit Selected
                </button>
                <button 
                  onClick={handleMultiDelete}
                  style={{ 
                    padding: "0.5rem 1rem",
                    fontSize: "0.8rem",
                    height: "32px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Delete Selected
                </button>
              </div>
            </>
          )}

          <button 
            className="button" 
            onClick={resetPositions}
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

          <button 
            onClick={toggleTheme}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              height: "32px",
              background: isDarkMode ? "#3b82f6" : "#f3f4f6",
              color: isDarkMode ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginLeft: "0.5rem"
            }}
          >
            {isDarkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        {/* Multi-edit modal */}
        {isMultiEditing && (
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            minWidth: "300px"
          }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>
              Edit {selectedNodes.length} Nodes
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="text"
                value={multiEditText}
                onChange={(e) => setMultiEditText(e.target.value)}
                placeholder="Enter text for all selected nodes"
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(204, 204, 204, 0.5)"
                }}
              />
              <input
                type="time"
                value={multiEditTime}
                onChange={(e) => setMultiEditTime(e.target.value)}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(204, 204, 204, 0.5)"
                }}
              />
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setIsMultiEditing(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.9rem",
                    background: "#f3f4f6",
                    border: "1px solid rgba(204, 204, 204, 0.5)",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMultiEditSave}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.9rem",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <div 
          className="canvas" 
          ref={canvasRef} 
          style={{
            ...canvasStyle,
            background: isDarkMode ? "#1a1a1a" : "white"
          }}
          onClick={e => {
            // Only clear if clicking the canvas background itself
            if (e.target === canvasRef.current) {
              setSelectedNodes([]);
              setEditingNode(null);
            }
          }}
        >
          <div style={contentStyle}>
            {/* Connection lines */}
            {showArrows && (
              <svg className="connection-lines" style={{ 
                position: "absolute", 
                width: "100%", 
                height: "100%",
                pointerEvents: "none",
                zIndex: 1,
                transform: `translate3d(0, 0, 0)`,
                willChange: "transform"
              }}>
                {connections.map(({ from, to }, index) => {
                  const fromNode = getNodeById(from);
                  const toNode = getNodeById(to);
                  if (!fromNode || !toNode) return null;

                  // Calculate node centers
                  const fromCenterX = fromNode.x + 40; // Half of node width (80/2)
                  const fromCenterY = fromNode.y + 22.5; // Half of node height (45/2)
                  const toCenterX = toNode.x + 40;
                  const toCenterY = toNode.y + 22.5;

                  // Calculate direction vector
                  const dx = toCenterX - fromCenterX;
                  const dy = toCenterY - fromCenterY;
                  const len = Math.sqrt(dx * dx + dy * dy);

                  // Calculate node radius (approximate)
                  const nodeRadius = 35; // Average of width and height

                  // Calculate start and end points
                  const startX = fromCenterX + (dx / len) * nodeRadius;
                  const startY = fromCenterY + (dy / len) * nodeRadius;
                  const endX = toCenterX - (dx / len) * nodeRadius;
                  const endY = toCenterY - (dy / len) * nodeRadius;

                  // Calculate arrow head
                  const arrowLength = 8;
                  const arrowWidth = 4;
                  const angle = Math.atan2(dy, dx);
                  const arrowAngle1 = angle - Math.PI / 6;
                  const arrowAngle2 = angle + Math.PI / 6;

                  const arrowX1 = endX - arrowLength * Math.cos(arrowAngle1);
                  const arrowY1 = endY - arrowLength * Math.sin(arrowAngle1);
                  const arrowX2 = endX - arrowLength * Math.cos(arrowAngle2);
                  const arrowY2 = endY - arrowLength * Math.sin(arrowAngle2);

                  return (
                    <g key={index}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isDarkMode ? "#666666" : "#666666"}
                        strokeWidth={1.5 / zoom}
                        strokeDasharray={`${4 / zoom} ${2 / zoom}`}
                        strokeOpacity={isDarkMode ? "0.4" : "0.6"}
                      />
                      <path
                        d={`M ${endX} ${endY} L ${arrowX1} ${arrowY1} L ${arrowX2} ${arrowY2} Z`}
                        fill={isDarkMode ? "#666666" : "#666666"}
                        fillOpacity={isDarkMode ? "0.4" : "0.6"}
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Nodes - Now rendered after connections */}
            {nodes.map((node) => (
              <Draggable
                key={node.id}
                bounds="parent"
                position={{ x: node.x, y: node.y }}
                onDrag={(e, data) => handleDrag(e, data, node.id)}
                onStart={handleDragStart}
                onStop={handleDragStop}
                disabled={editingNode?.id === node.id}
                grid={[1, 1]}
                scale={zoom}
                defaultClassNameDragging="dragging"
                defaultClassName="node"
                defaultClassNameDragged="dragged"
              >
                <div
                  className={`node ${selectedNodes.includes(node.id) ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if ((e.metaKey || e.ctrlKey) && selectedNodes.length === 1 && !selectedNodes.includes(node.id)) {
                      // Cmd/Ctrl + click: connect from selected node to this node
                      const from = selectedNodes[0];
                      const to = node.id;
                      const exists = connections.some(
                        (conn) => (conn.from === from && conn.to === to) || (conn.from === to && conn.to === from)
                      );
                      if (!exists) {
                        setConnections(prevConnections => [
                          ...prevConnections,
                          { from, to }
                        ]);
                      }
                      // After connecting, select only the second node
                      setSelectedNodes([to]);
                    } else {
                      setSelectedNodes(prev => {
                        if (prev.includes(node.id)) {
                          // Unselect if already selected
                          return prev.filter(id => id !== node.id);
                        } else if (prev.length < 2) {
                          // Add to selection if less than 2
                          return [...prev, node.id];
                        } else {
                          // If already 2 selected, replace with just this node
                          return [node.id];
                        }
                      });
                    }
                  }}
                  onDoubleClick={(e) => handleDoubleClick(e, node)}
                  style={{
                    ...getNodeStyle(node, selectedNodes.includes(node.id)),
                    zIndex: selectedNodes.includes(node.id) ? 1000 : 2
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
                      color: node.type === 'goal' ? (isDarkMode ? '#6ee7b7' : 'rgb(22, 163, 74)') :
                             node.type === 'action' ? (isDarkMode ? '#93c5fd' : 'rgb(37, 99, 235)') :
                             (isDarkMode ? '#fde68a' : 'rgb(202, 138, 4)'),
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
                        color: isDarkMode ? '#fff' : '#666',
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
                      {/* Prevent canvas click from closing edit when clicking inside the edit box */}
                      <div onClick={e => e.stopPropagation()}>
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
                    </div>
                  ) : (
                    <div style={{
                      fontSize: "0.75rem",
                      color: isDarkMode ? "#fff" : "#333",
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

          <ZoomControls />
        </div>
      </div>

      {/* Right Side */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        gap: "1rem", 
        padding: "1.5rem",
        paddingTop: "2rem",
        maxHeight: "calc(100vh - 4rem)",
        overflow: "hidden",
        zIndex: 5,
        background: isDarkMode ? "#2d2d2d" : "white",
        borderLeft: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`,
        position: "relative"
      }}>
        {/* Task Sequence Section */}
        <div style={{
          flex: 1,
          padding: "2rem",
          background: isDarkMode ? "rgba(45, 45, 45, 0.7)" : "rgba(247, 247, 247, 0.7)",
          overflowY: "auto",
          backdropFilter: "blur(4px)",
          borderRadius: "12px",
          boxShadow: isDarkMode ? "0 2px 4px rgba(0, 0, 0, 0.2)" : "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.7)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
          className="hide-scrollbar"
        >
          <div style={{
            position: "sticky",
            top: 0,
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            background: isDarkMode ? "rgba(45, 45, 45, 0.9)" : "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`,
            boxShadow: isDarkMode ? "0 1px 2px rgba(0, 0, 0, 0.1)" : "0 1px 2px rgba(0, 0, 0, 0.02)",
            backdropFilter: "blur(8px)",
            zIndex: 1
          }}>
            <h3 style={{ 
              fontSize: "1rem",
              fontWeight: "600",
              color: isDarkMode ? "#ffffff" : "#333",
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
                background: isDarkMode ? "rgba(45, 45, 45, 0.7)" : "rgba(255, 255, 255, 0.7)",
                borderRadius: "8px",
                border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                boxShadow: isDarkMode ? "0 1px 2px rgba(0, 0, 0, 0.1)" : "0 1px 2px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s ease",
                cursor: "default",
                position: "relative"
              }}>
                <span style={{ 
                  color: isDarkMode ? "#ffffff" : "#333", 
                  flex: 1,
                  lineHeight: "1.5"
                }}>{node.text}</span>
                {node.time && (
                  <span style={{ 
                    color: isDarkMode ? "#cccccc" : "#666",
                    fontSize: "0.8rem",
                    padding: "4px 10px",
                    background: isDarkMode ? "rgba(45, 45, 45, 0.8)" : "rgba(255, 255, 255, 0.8)",
                    borderRadius: "6px",
                    border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.2)"}`,
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
          background: isDarkMode ? "rgba(45, 45, 45, 0.7)" : "rgba(247, 247, 247, 0.7)",
          overflowY: "auto",
          backdropFilter: "blur(4px)",
          borderRadius: "8px",
          boxShadow: isDarkMode ? "0 2px 4px rgba(0, 0, 0, 0.2)" : "0 2px 4px rgba(0, 0, 0, 0.05)",
          border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.7)",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
          className="hide-scrollbar"
        >
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "1rem",
            padding: "0.5rem",
            background: isDarkMode ? "rgba(45, 45, 45, 0.5)" : "rgba(255, 255, 255, 0.5)",
            borderRadius: "6px",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`
          }}>
            <h3 style={{ 
              fontSize: "0.9rem",
              fontWeight: "600",
              color: isDarkMode ? "#ffffff" : "#333",
              margin: 0
            }}>Saved Plans</h3>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              style={{
                padding: "2px 8px",
                borderRadius: "4px",
                border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(204, 204, 204, 0.5)"}`,
                background: isDarkMode ? "rgba(45, 45, 45, 0.9)" : "rgba(255, 255, 255, 0.9)",
                color: isDarkMode ? "#ffffff" : "#333",
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
              background: isDarkMode ? "rgba(45, 45, 45, 0.5)" : "rgba(255, 255, 255, 0.5)",
              borderRadius: "6px",
              border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`,
              color: isDarkMode ? "#cccccc" : "#666",
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
                  background: isDarkMode ? "rgba(45, 45, 45, 0.5)" : "rgba(255, 255, 255, 0.5)",
                  borderRadius: "6px",
                  border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.3)"}`
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "0.5rem"
                  }}>
                    <span style={{ 
                      fontWeight: "500",
                      color: isDarkMode ? "#ffffff" : "#333"
                    }}>{name}</span>
                    <span style={{
                      fontSize: "0.75rem",
                      color: isDarkMode ? "#cccccc" : "#666",
                      padding: "2px 6px",
                      background: isDarkMode ? "rgba(45, 45, 45, 0.5)" : "rgba(255, 255, 255, 0.5)",
                      borderRadius: "4px",
                      border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.2)"}`
                    }}>
                      {new Date(plan.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                    color: isDarkMode ? "#cccccc" : "#666"
                  }}>
                    {[
                      { label: "Goals", count: plan.goals.length },
                      { label: "Actions", count: plan.actions.length },
                      { label: "Hobbies", count: plan.hobbies.length }
                    ].map(({ label, count }) => (
                      <div key={label} style={{
                        padding: "0.25rem",
                        background: isDarkMode ? "rgba(45, 45, 45, 0.3)" : "rgba(255, 255, 255, 0.3)",
                        borderRadius: "4px",
                        border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(204, 204, 204, 0.2)"}`,
                        textAlign: "center"
                      }}>
                        <div style={{ 
                          fontWeight: "500",
                          color: isDarkMode ? "#ffffff" : "#333"
                        }}>{label}</div>
                        <div style={{ color: isDarkMode ? "#cccccc" : "#666" }}>{count}</div>
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


