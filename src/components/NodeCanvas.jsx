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
  const canvasRef = useRef(null);

  // Load saved plans on component mount
  useEffect(() => {
    const savedPlansData = localStorage.getItem("mindOS_savedPlans");
    if (savedPlansData) {
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
    
    const newNode = {
      id: uuidv4(),
      text: input,
      time,
      x: centerX,
      y: centerY,
    };
    
    setNodes([...nodes, newNode]);
    setInput("");
    setTime("");
    
    // Scroll the new node into view if needed
    canvas.scrollTo({
      left: centerX - (canvasRect.width / 2) + 100,
      top: centerY - (canvasRect.height / 2) + 30,
      behavior: 'smooth'
    });
  };

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
    const nodeWidth = 120; // Slightly wider nodes
    const nodeHeight = 100; // Taller nodes to account for content
    const horizontalGap = 80; // Gap between nodes horizontally
    const verticalGap = 60; // Gap between rows
    const totalHorizontalSpacing = nodeWidth + horizontalGap; // Total space needed horizontally per node
    const totalVerticalSpacing = nodeHeight + verticalGap; // Total space needed vertically per node
    
    // Calculate how many nodes can fit in a row
    const nodesPerRow = Math.floor((canvasRect.width - 100) / totalHorizontalSpacing) || 1;
    
    // Position nodes in a grid
    const repositionedNodes = sortedNodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      
      return {
        ...node,
        // Start 50px from left, add spacing for each column
        x: 50 + (col * totalHorizontalSpacing),
        // Start 50px from top, add spacing for each row
        y: 50 + (row * totalVerticalSpacing)
      };
    });

    // Update state
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

    // Ensure the canvas shows the top-left of the layout
    canvas.scrollTo({
      left: 0,
      top: 0,
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
    
    // Create nodes with proper spacing
    const nodeSpacing = 250; // Vertical spacing between nodes
    const startY = 100; // Starting Y position
    
    const newNodes = sortedTasks.map((task, index) => ({
      id: uuidv4(),
      text: task.text,
      time: task.time,
      type: task.type,
      x: 100,
      y: startY + (index * nodeSpacing)
    }));
    
    // Create connections between nodes
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
  };

  // Update the plan selection handler
  useEffect(() => {
    if (selectedPlan && savedPlans[selectedPlan]) {
      createNodesFromPlan(savedPlans[selectedPlan]);
    }
  }, [selectedPlan, savedPlans]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Side */}
      <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
        <div className="toolbar" style={{ padding: "0.5rem", gap: "0.5rem", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(204, 204, 204, 0.3)" }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter node text"
            style={{
              padding: "4px 8px",
              fontSize: "0.8rem",
              height: "28px"
            }}
          />
          <input
            type="time"
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              maxWidth: "100px",
              padding: "4px 8px",
              fontSize: "0.8rem",
              height: "28px"
            }}
          />
          <button className="button" onClick={handleAddNode} style={{ padding: "4px 12px", fontSize: "0.8rem", height: "28px" }}>
            Add Node
          </button>
          <button className="button" onClick={resetPositions} style={{ padding: "4px 12px", fontSize: "0.8rem", height: "28px" }}>
            Reset Positions
          </button>
          <button className="button" onClick={clearCanvas} style={{ padding: "4px 12px", fontSize: "0.8rem", height: "28px", background: "#dc2626" }}>
            Clear Canvas
          </button>
        </div>

        <div className="canvas" ref={canvasRef} style={{ 
          flex: 1, 
          position: "relative",
          overflow: "auto",
          padding: "1rem",
          minWidth: "100%",
          minHeight: "100%"
        }}>
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

              // Calculate connection points from the center of nodes
              const x1 = fromNode.x + 60;
              const y1 = fromNode.y + 50;
              const x2 = toNode.x + 60;
              const y2 = toNode.y + 50;

              // Calculate the path
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              const shorten = 35;

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
                    stroke="#333"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                  <circle
                    cx={ex}
                    cy={ey}
                    r={3}
                    fill="#333"
                  />
                </g>
              );
            })}
          </svg>

          {nodes.map((node) => (
            <Draggable
              key={node.id}
              bounds="parent"
              position={{ x: node.x, y: node.y }}
              onDrag={(e, data) => handleDrag(e, data, node.id)}
            >
              <div
                className={`node ${
                  selectedNodes.includes(node.id) ? "selected" : ""
                }`}
                onClick={(e) => handleClickNode(e, node.id)}
                style={{
                  position: "absolute",
                  width: "120px",
                  minHeight: "80px",
                  padding: "0.75rem",
                  background: node.type === 'goal' ? 'rgba(34, 197, 94, 0.1)' :
                             node.type === 'action' ? 'rgba(59, 130, 246, 0.1)' :
                             'rgba(234, 179, 8, 0.1)',
                  borderRadius: "6px",
                  border: `1px solid ${
                    node.type === 'goal' ? 'rgba(34, 197, 94, 0.3)' :
                    node.type === 'action' ? 'rgba(59, 130, 246, 0.3)' :
                    'rgba(234, 179, 8, 0.3)'
                  }`,
                  cursor: "move",
                  fontSize: "0.75rem",
                  userSelect: "none",
                  zIndex: selectedNodes.includes(node.id) ? 1000 : 2,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <div style={{
                  fontSize: "0.7rem",
                  color: node.type === 'goal' ? 'rgb(22, 163, 74)' :
                         node.type === 'action' ? 'rgb(37, 99, 235)' :
                         'rgb(202, 138, 4)',
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: "500"
                }}>
                  {node.type}
                </div>
                <div style={{
                  wordBreak: "break-word",
                  lineHeight: 1.3
                }}>{node.text}</div>
                {node.time && (
                  <div style={{
                    fontSize: "0.7rem",
                    color: "#666",
                    marginTop: "auto",
                    padding: "2px 6px",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "3px",
                    border: "1px solid rgba(204, 204, 204, 0.2)",
                    alignSelf: "flex-start"
                  }}>
                    🕒 {node.time}
                  </div>
                )}
              </div>
            </Draggable>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", margin: "1rem" }}>
        {/* Task Sequence Section */}
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
            }}>Task Sequence</h3>
          </div>
          <ol style={{ 
            paddingLeft: "1.5rem",
            paddingRight: "0.5rem",
            listStyleType: "decimal",
            listStylePosition: "outside",
            margin: 0,
            fontSize: "0.8rem"
          }}>
            {getTaskSequence().map((node) => (
              <li key={node.id} style={{ 
                marginBottom: "0.5rem",
                padding: "0.5rem 0.75rem",
                background: "rgba(255, 255, 255, 0.5)",
                borderRadius: "6px",
                border: "1px solid rgba(204, 204, 204, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem"
              }}>
                <span style={{ color: "#333", flex: 1 }}>{node.text}</span>
                {node.time && (
                  <span style={{ 
                    color: "#666",
                    fontSize: "0.75rem",
                    padding: "2px 6px",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "4px",
                    border: "1px solid rgba(204, 204, 204, 0.2)",
                    whiteSpace: "nowrap"
                  }}>
                    🕒 {node.time}
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