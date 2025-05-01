import React, { useState, useEffect } from "react";

const SAMPLE_PLAN = {
  "Sample 1 - Morning Routine": {
    goals: [
      { text: "Complete morning meditation", duration: "15" },
      { text: "Exercise and stretch", duration: "30" },
      { text: "Read morning news", duration: "20" }
    ],
    actions: [
      { text: "Take a shower", duration: "15" },
      { text: "Prepare breakfast", duration: "20" },
      { text: "Check emails", duration: "30" },
      { text: "Plan day ahead", duration: "15" }
    ],
    hobbies: [
      { text: "Practice guitar", duration: "30" },
      { text: "Write in journal", duration: "20" }
    ],
    lastUpdated: new Date().toISOString()
  },
  "Sample 2 - Work Day": {
    goals: [
      { text: "Complete project milestone", duration: "180" },
      { text: "Attend team meetings", duration: "60" },
      { text: "Review and respond to emails", duration: "45" }
    ],
    actions: [
      { text: "Morning standup", duration: "15" },
      { text: "Code review", duration: "60" },
      { text: "Documentation update", duration: "45" },
      { text: "Client call", duration: "30" }
    ],
    hobbies: [
      { text: "Take a walk", duration: "20" },
      { text: "Read tech articles", duration: "30" }
    ],
    lastUpdated: new Date().toISOString()
  },
  "Sample 3 - Weekend Plan": {
    goals: [
      { text: "Clean the house", duration: "120" },
      { text: "Grocery shopping", duration: "60" },
      { text: "Meal prep for week", duration: "90" }
    ],
    actions: [
      { text: "Morning workout", duration: "45" },
      { text: "Laundry", duration: "60" },
      { text: "Garden maintenance", duration: "45" }
    ],
    hobbies: [
      { text: "Watch a movie", duration: "120" },
      { text: "Play video games", duration: "60" },
      { text: "Cook new recipe", duration: "90" }
    ],
    lastUpdated: new Date().toISOString()
  }
};

export default function DailyPlanner() {
  const [goals, setGoals] = useState([{ text: "", duration: "" }]);
  const [actions, setActions] = useState([{ text: "", duration: "" }]);
  const [hobbies, setHobbies] = useState([{ text: "", duration: "" }]);
  const [savedPlans, setSavedPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlanName, setEditingPlanName] = useState("");

  // Load saved plans on component mount
  useEffect(() => {
    const savedPlansData = localStorage.getItem("mindOS_savedPlans");
    if (savedPlansData) {
      setSavedPlans(JSON.parse(savedPlansData));
    } else {
      // If no saved plans exist, initialize with sample plans
      localStorage.setItem("mindOS_savedPlans", JSON.stringify(SAMPLE_PLAN));
      setSavedPlans(SAMPLE_PLAN);
      setSelectedPlan("Sample 1 - Morning Routine");
    }
  }, []);

  // Load selected plan
  useEffect(() => {
    if (selectedPlan && savedPlans[selectedPlan]) {
      const plan = savedPlans[selectedPlan];
      setGoals(plan.goals.length ? plan.goals : [{ text: "", duration: "" }]);
      setActions(plan.actions.length ? plan.actions : [{ text: "", duration: "" }]);
      setHobbies(plan.hobbies.length ? plan.hobbies : [{ text: "", duration: "" }]);
      setEditingPlanName(selectedPlan);
    }
  }, [selectedPlan, savedPlans]);

  const updateField = (setter, index, value) => {
    setter(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = (e) => {
    if (isEditing) {
      // Update existing plan
      const updatedPlans = { ...savedPlans };
      delete updatedPlans[selectedPlan];
      
      const plan = {
        goals: goals.filter(item => item.text.trim() !== ""),
        actions: actions.filter(item => item.text.trim() !== ""),
        hobbies: hobbies.filter(item => item.text.trim() !== ""),
        lastUpdated: new Date().toISOString()
      };

      updatedPlans[editingPlanName] = plan;
      localStorage.setItem("mindOS_savedPlans", JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);
      setSelectedPlan(editingPlanName);
      setIsEditing(false);
      alert("Plan updated successfully!");
    } else {
      // Create new plan
      const planName = prompt("Enter a name for this plan:", "My Plan");
      if (!planName) return;

      const plan = {
        goals: goals.filter(item => item.text.trim() !== ""),
        actions: actions.filter(item => item.text.trim() !== ""),
        hobbies: hobbies.filter(item => item.text.trim() !== ""),
        lastUpdated: new Date().toISOString()
      };

      const updatedPlans = {
        ...savedPlans,
        [planName]: plan
      };

      localStorage.setItem("mindOS_savedPlans", JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);
      setSelectedPlan(planName);
      setEditingPlanName(planName);
      alert("Your daily plan is saved!");
    }
  };

  const handleDeletePlan = (planName) => {
    if (window.confirm(`Are you sure you want to delete "${planName}"?`)) {
      const updatedPlans = { ...savedPlans };
      delete updatedPlans[planName];
      localStorage.setItem("mindOS_savedPlans", JSON.stringify(updatedPlans));
      setSavedPlans(updatedPlans);
      if (selectedPlan === planName) {
        setSelectedPlan("");
        setGoals([{ text: "", duration: "" }]);
        setActions([{ text: "", duration: "" }]);
        setHobbies([{ text: "", duration: "" }]);
        setIsEditing(false);
      }
    }
  };

  const handleClearCurrent = () => {
    if (window.confirm("Are you sure you want to clear the current plan?")) {
      setGoals([{ text: "", duration: "" }]);
      setActions([{ text: "", duration: "" }]);
      setHobbies([{ text: "", duration: "" }]);
      setSelectedPlan("");
      setIsEditing(false);
    }
  };

  const handleEditPlan = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPlanName(selectedPlan);
  };

  const removeAllPlans = () => {
    if (window.confirm("Are you sure you want to remove all plans? This cannot be undone.")) {
      localStorage.removeItem("mindOS_savedPlans");
      setSavedPlans({});
      setSelectedPlan("");
      setGoals([{ text: "", duration: "" }]);
      setActions([{ text: "", duration: "" }]);
      setHobbies([{ text: "", duration: "" }]);
      setIsEditing(false);
      alert("All plans have been removed!");
    }
  };

  const renderList = (label, values, setter) => (
    <div style={{
      marginBottom: "2rem",
      padding: "1.5rem",
      background: "rgba(255, 255, 255, 0.5)",
      borderRadius: "8px",
      border: "1px solid rgba(204, 204, 204, 0.3)",
      backdropFilter: "blur(4px)"
    }}>
      <h2 style={{
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#333",
        marginBottom: "1rem"
      }}>{label}</h2>
      {values.map((v, i) => (
        <div key={i} style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "0.75rem",
          alignItems: "center"
        }}>
          <input
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              border: "1px solid rgba(204, 204, 204, 0.5)",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.95rem"
            }}
            placeholder={`Enter ${label.toLowerCase()} ${i + 1}`}
            value={v.text || ""}
            onChange={(e) => updateField(setter, i, { ...v, text: e.target.value })}
          />
          <input
            type="number"
            min="0"
            style={{
              width: "100px",
              padding: "0.75rem 1rem",
              border: "1px solid rgba(204, 204, 204, 0.5)",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.95rem"
            }}
            placeholder="Minutes"
            value={v.duration || ""}
            onChange={(e) => updateField(setter, i, { ...v, duration: e.target.value })}
          />
        </div>
      ))}
      <button
        onClick={() => setter([...values, { text: "", duration: "" }])}
        style={{
          color: "#2196f3",
          padding: "0.5rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "0.95rem"
        }}
      >
        + Add more
      </button>
    </div>
  );

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "2rem auto",
      padding: "0 2rem",
      height: "calc(100vh - 84px)", // Account for navbar height
      overflowY: "auto",
      position: "relative",
      marginTop: "84px" // Add top margin to account for fixed navbar
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "rgba(247, 247, 247, 0.7)",
        borderRadius: "12px",
        backdropFilter: "blur(4px)",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#333"
        }}>📝 Plan Your Day</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: "rgba(255, 255, 255, 0.9)",
              color: "#333"
            }}
          >
            <option value="">Select a saved plan</option>
            {Object.keys(savedPlans).map((planName) => (
              <option key={planName} value={planName}>
                {planName}
              </option>
            ))}
          </select>
          <button
            onClick={removeAllPlans}
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(220, 38, 38, 0.9)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Remove All Plans
          </button>
          {selectedPlan && (
            <>
              <button
                onClick={() => handleDeletePlan(selectedPlan)}
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(220, 38, 38, 0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Delete Plan
              </button>
              {!isEditing ? (
                <button
                  onClick={handleEditPlan}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "rgba(37, 99, 235, 0.9)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Edit Plan
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "rgba(107, 114, 128, 0.9)",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
        minHeight: "calc(100vh - 200px)", // Give enough room for content
        paddingBottom: "2rem" // Add bottom padding for better spacing
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          height: "100%",
          overflowY: "auto"
        }}>
          {isEditing && (
            <div style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              background: "rgba(255, 255, 255, 0.5)",
              borderRadius: "8px",
              border: "1px solid rgba(204, 204, 204, 0.3)",
              backdropFilter: "blur(4px)"
            }}>
              <label style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: "500",
                color: "#333",
                marginBottom: "0.5rem"
              }}>
                Plan Name
              </label>
              <input
                type="text"
                value={editingPlanName}
                onChange={(e) => setEditingPlanName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "1px solid rgba(204, 204, 204, 0.5)",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.9)",
                  fontSize: "0.95rem"
                }}
                placeholder="Enter plan name"
              />
            </div>
          )}
          {renderList("Goals", goals, setGoals)}
          {renderList("Action Tasks", actions, setActions)}
          {renderList("Hobbies", hobbies, setHobbies)}
          <div style={{
            display: "flex",
            gap: "1rem",
            marginTop: "2rem"
          }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: "0.75rem 1.5rem",
                background: "rgba(22, 163, 74, 0.9)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {isEditing ? "Update Plan" : "Save Plan"}
            </button>
            <button
              onClick={handleClearCurrent}
              style={{
                padding: "0.75rem 1.5rem",
                background: "rgba(107, 114, 128, 0.9)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Clear Current
            </button>
          </div>
        </div>

        <div style={{
          padding: "2rem",
          background: "rgba(247, 247, 247, 0.7)",
          borderRadius: "12px",
          backdropFilter: "blur(4px)",
          height: "fit-content",
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#333",
            marginBottom: "1.5rem"
          }}>Saved Plans</h2>
          
          {selectedPlan && savedPlans[selectedPlan] && (
            <div style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "8px",
              border: "2px solid rgba(33, 150, 243, 0.3)",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "rgba(33, 150, 243, 0.1)",
                borderRadius: "6px"
              }}>
                <h3 style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#333",
                  margin: 0
                }}>Currently Selected: {selectedPlan}</h3>
                <span style={{
                  fontSize: "0.875rem",
                  color: "#666",
                  padding: "0.25rem 0.75rem",
                  background: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "4px",
                  border: "1px solid rgba(204, 204, 204, 0.2)"
                }}>
                  Last updated: {new Date(savedPlans[selectedPlan].lastUpdated).toLocaleDateString()}
                </span>
              </div>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem"
              }}>
                {[
                  { label: "Goals", items: savedPlans[selectedPlan].goals },
                  { label: "Actions", items: savedPlans[selectedPlan].actions },
                  { label: "Hobbies", items: savedPlans[selectedPlan].hobbies }
                ].map(({ label, items }) => (
                  <div key={label} style={{
                    padding: "1rem",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "6px",
                    border: "1px solid rgba(204, 204, 204, 0.2)"
                  }}>
                    <h4 style={{
                      fontSize: "1rem",
                      fontWeight: "500",
                      color: "#333",
                      marginBottom: "0.75rem",
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid rgba(204, 204, 204, 0.2)"
                    }}>{label}</h4>
                    <ul style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0
                    }}>
                      {items.map((item, index) => (
                        <li key={index} style={{
                          padding: "0.5rem",
                          marginBottom: "0.5rem",
                          background: "rgba(255, 255, 255, 0.5)",
                          borderRadius: "4px",
                          border: "1px solid rgba(204, 204, 204, 0.2)"
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}>
                            <span style={{ flex: 1 }}>{item.text}</span>
                            <span style={{
                              padding: "0.25rem 0.5rem",
                              background: "rgba(33, 150, 243, 0.1)",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              color: "#2196f3",
                              marginLeft: "0.5rem"
                            }}>
                              ⏱️ {item.duration ? `${item.duration}m` : '--'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "rgba(33, 150, 243, 0.1)",
                borderRadius: "6px",
                textAlign: "right",
                color: "#333",
                fontSize: "0.95rem",
                fontWeight: "500"
              }}>
                Total Duration: {
                  [...savedPlans[selectedPlan].goals, 
                   ...savedPlans[selectedPlan].actions, 
                   ...savedPlans[selectedPlan].hobbies]
                    .reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0)
                } minutes
              </div>
            </div>
          )}
          
          {Object.entries(savedPlans).length === 0 ? (
            <p style={{ color: "#666" }}>No saved plans yet</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {Object.entries(savedPlans).map(([name, plan]) => (
                <li key={name} style={{
                  marginBottom: "1rem",
                  padding: "1.25rem",
                  background: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "8px",
                  border: "1px solid rgba(204, 204, 204, 0.3)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(255, 255, 255, 0.5)",
                    borderRadius: "6px",
                    border: "1px solid rgba(204, 204, 204, 0.2)"
                  }}>
                    <span style={{ fontWeight: "500" }}>{name}</span>
                    <span style={{
                      fontSize: "0.875rem",
                      color: "#666",
                      padding: "0.25rem 0.75rem",
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
                    gap: "0.75rem",
                    marginBottom: "1rem"
                  }}>
                    {[
                      { label: "Goals", items: plan.goals },
                      { label: "Actions", items: plan.actions },
                      { label: "Hobbies", items: plan.hobbies }
                    ].map(({ label, items }) => (
                      <div key={label} style={{
                        padding: "0.75rem",
                        background: "rgba(255, 255, 255, 0.3)",
                        borderRadius: "6px",
                        border: "1px solid rgba(204, 204, 204, 0.2)"
                      }}>
                        <div style={{ 
                          fontWeight: "500",
                          marginBottom: "0.5rem",
                          color: "#333",
                          fontSize: "0.95rem"
                        }}>{label}</div>
                        <div style={{
                          fontSize: "0.875rem",
                          color: "#666"
                        }}>
                          {items.map((item, index) => (
                            <div key={index} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.5rem",
                              borderBottom: index < items.length - 1 ? "1px solid rgba(204, 204, 204, 0.2)" : "none"
                            }}>
                              <span style={{ flex: 1 }}>{item.text}</span>
                              <span style={{
                                padding: "0.25rem 0.5rem",
                                background: "rgba(255, 255, 255, 0.5)",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                color: "#666",
                                marginLeft: "0.5rem"
                              }}>
                                ⏱️ {item.duration ? `${item.duration}m` : '--'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: "0.5rem",
                    borderTop: "1px solid rgba(204, 204, 204, 0.2)",
                    color: "#666",
                    fontSize: "0.875rem"
                  }}>
                    Total Duration: {
                      [...plan.goals, ...plan.actions, ...plan.hobbies]
                        .reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0)
                    } minutes
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
