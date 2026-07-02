import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, CheckCircle2, Circle, Sparkles, Trophy, BookOpen, Clock, Loader2, AlertCircle } from "lucide-react";
import { StudyPlan, StudyTask } from "../types";

export default function StudyScheduler() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Form input state
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [targetExamDate, setTargetExamDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Load plans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("study_scheduler_plans");
    if (saved) {
      try {
        setPlans(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed with a default exam plan
      const defaultPlan: StudyPlan = {
        id: "plan_default_1",
        topic: "Machine Learning Foundations",
        difficulty: "Intermediate",
        targetExamDate: "Next Friday",
        createdAt: new Date().toISOString(),
        days: [
          {
            dayNumber: 1,
            theme: "Core Principles & Definitions",
            tasks: [
              { id: "t1", title: "Review Supervised vs Unsupervised learning", durationMinutes: 30, isCompleted: true, notes: "Remember that classification is discrete and regression is continuous." },
              { id: "t2", title: "Practice gradient descent calculation", durationMinutes: 45, isCompleted: false, notes: "Write down the weight update formula and trace 1 iteration step." }
            ]
          },
          {
            dayNumber: 2,
            theme: "Linear & Logistic Regression",
            tasks: [
              { id: "t3", title: "Define the cost function for linear regression", durationMinutes: 30, isCompleted: false, notes: "Formulate Ordinary Least Squares (OLS) equations." },
              { id: "t4", title: "Solve Logistic Loss equations", durationMinutes: 40, isCompleted: false, notes: "Understand why Mean Squared Error is non-convex for classification." }
            ]
          }
        ]
      };
      setPlans([defaultPlan]);
      setSelectedPlanId(defaultPlan.id);
      localStorage.setItem("study_scheduler_plans", JSON.stringify([defaultPlan]));
    }
  }, []);

  const savePlans = (updatedPlans: StudyPlan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem("study_scheduler_plans", JSON.stringify(updatedPlans));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, targetExamDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      const parsedPlan: StudyPlan = {
        id: "plan_" + Math.random().toString(36).substr(2, 9),
        topic: data.topic,
        difficulty,
        targetExamDate,
        createdAt: new Date().toISOString(),
        days: data.days.map((day: any) => ({
          dayNumber: day.dayNumber,
          theme: day.theme,
          tasks: day.tasks.map((task: any) => ({
            id: "task_" + Math.random().toString(36).substr(2, 9),
            title: task.title,
            durationMinutes: task.durationMinutes,
            isCompleted: false,
            notes: task.notes
          }))
        }))
      };

      const updated = [parsedPlan, ...plans];
      savePlans(updated);
      setSelectedPlanId(parsedPlan.id);
      
      // Clear inputs
      setTopic("");
      setTargetExamDate("");
    } catch (err: any) {
      setError(err.message || "Failed to communicate with AI model. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePlan = (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this study plan?")) {
      const updated = plans.filter(p => p.id !== planId);
      savePlans(updated);
      if (selectedPlanId === planId) {
        setSelectedPlanId(updated[0]?.id || null);
      }
    }
  };

  const toggleTaskCompletion = (planId: string, dayNumber: number, taskId: string) => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          days: p.days.map(d => {
            if (d.dayNumber === dayNumber) {
              return {
                ...d,
                tasks: d.tasks.map(t => {
                  if (t.id === taskId) {
                    return { ...t, isCompleted: !t.isCompleted };
                  }
                  return t;
                })
              };
            }
            return d;
          })
        };
      }
      return p;
    });
    savePlans(updated);
  };

  const activePlan = plans.find(p => p.id === selectedPlanId);

  // Compute stats for active plan
  const getPlanStats = (plan: StudyPlan) => {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalMinutes = 0;
    let completedMinutes = 0;

    plan.days.forEach(d => {
      d.tasks.forEach(t => {
        totalTasks++;
        totalMinutes += t.durationMinutes;
        if (t.isCompleted) {
          completedTasks++;
          completedMinutes += t.durationMinutes;
        }
      });
    });

    return {
      totalTasks,
      completedTasks,
      totalMinutes,
      completedMinutes,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  return (
    <div id="scheduler-root-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: AI Planner Form & Plans list */}
      <div id="planner-left-column" className="space-y-6">
        {/* Scribe Study Plan Form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Study Plan Scribe
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Let Gemini architect a highly tactical 5-day study syllabus tailored to your syllabus topic, current knowledge depth, and exam milestone.
          </p>

          <form onSubmit={handleGeneratePlan} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject or Exam Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Newtonian Physics Midterm"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Exam Date (Optional)</label>
                <input
                  type="text"
                  value={targetExamDate}
                  onChange={(e) => setTargetExamDate(e.target.value)}
                  placeholder="e.g. July 15"
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 disabled:opacity-75"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Architecting...
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5" />
                  Generate Study Plan
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[11px] flex items-center gap-2 mt-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Existing Plans */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Your Study Schedules
          </h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {plans.map((p) => {
              const { percentage } = getPlanStats(p);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedPlanId === p.id
                      ? "bg-indigo-50/30 border-indigo-200/80"
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{p.topic}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] uppercase font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{p.difficulty}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{percentage}% done</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeletePlan(p.id, e)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {plans.length === 0 && (
              <div className="text-center text-slate-300 text-xs py-8 italic">
                No active plans. Generate one using the form above!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Column: Day-by-Day Syllabus Timeline */}
      <div id="planner-main-syllabus" className="lg:col-span-2">
        {activePlan ? (
          <div className="space-y-6">
            {/* Plan Header Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
                    {activePlan.difficulty} Study Plan
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-800 mt-2">{activePlan.topic}</h2>
                  {activePlan.targetExamDate && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Target Milestone: {activePlan.targetExamDate}</span>
                    </p>
                  )}
                </div>

                {/* Progress Circle/Stats */}
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
                  <div>
                    <span className="text-xs text-slate-500 block">Syllabus Completion</span>
                    <span className="text-xl font-black text-slate-800">{getPlanStats(activePlan).percentage}%</span>
                  </div>
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="18" className="stroke-slate-200 fill-none" strokeWidth="3" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        className="stroke-indigo-600 fill-none transition-all duration-500"
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - getPlanStats(activePlan).percentage / 100)}
                      />
                    </svg>
                    {getPlanStats(activePlan).percentage === 100 ? (
                      <Trophy className="absolute w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <Calendar className="absolute w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Day-by-Day timeline block */}
            <div className="space-y-4">
              {activePlan.days.map((day) => {
                const isDayComplete = day.tasks.every(t => t.isCompleted);
                return (
                  <div key={day.dayNumber} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    {/* Day Header */}
                    <div className="bg-slate-50/50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-indigo-600 text-white rounded-lg px-2 py-0.5">
                          Day {day.dayNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{day.theme}</span>
                      </div>
                      {isDayComplete && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" />
                          Complete
                        </span>
                      )}
                    </div>

                    {/* Day Tasks List */}
                    <div className="p-5 space-y-4">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskCompletion(activePlan.id, day.dayNumber, task.id)}
                          className="group cursor-pointer flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50/50 transition-all border border-transparent hover:border-slate-100"
                        >
                          <button className="mt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-xs font-bold text-slate-800 ${task.isCompleted ? "line-through text-slate-400" : ""}`}>
                                {task.title}
                              </h4>
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {task.durationMinutes} min
                              </span>
                            </div>
                            {task.notes && (
                              <p className={`text-[10px] text-slate-500 mt-1 leading-relaxed ${task.isCompleted ? "opacity-50" : ""}`}>
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center text-slate-300 flex flex-col items-center justify-center min-h-[350px]">
            <Calendar className="w-12 h-12 stroke-[1.25] mb-2" />
            <span className="text-sm font-semibold">Select or Generate a Study Plan</span>
            <p className="text-xs text-slate-400 mt-1">Use the left panel to architect a custom study roadmap.</p>
          </div>
        )}
      </div>
    </div>
  );
}
