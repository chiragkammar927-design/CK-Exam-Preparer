import React, { useState } from "react";
import { Calendar, Brain, Layers, HelpCircle, Clock, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import StudyScheduler from "./components/StudyScheduler";
import AIStudyBuddy from "./components/AIStudyBuddy";
import FlashcardManager from "./components/FlashcardManager";
import QuizManager from "./components/QuizManager";
import PomodoroTimer from "./components/PomodoroTimer";

export default function App() {
  const [activeTab, setActiveTab] = useState<"scheduler" | "buddy" | "flashcards" | "quiz" | "pomodoro">("scheduler");

  return (
    <div id="study-app-root" className="min-h-screen bg-[#fafbfc] text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      {/* Dynamic Aesthetic Hero Header */}
      <header id="app-hero-header" className="bg-white border-b border-slate-100 py-6 px-4 md:px-8 mb-8 sticky top-0 z-40 shadow-sm/5 hover:shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Elegant Monogram Logo Badge */}
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-600/20 group">
              <span className="font-mono text-base font-black tracking-widest">CK</span>
              <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-sm border border-white">
                <GraduationCap className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                CK Exam Preparer
                <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI Scribe Enabled</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Your premium personal companion for active recall, schedules, and mock exams.</p>
            </div>
          </div>

          {/* Quick study motivation widget */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs text-slate-500 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span>Active recall is 150% more efficient than re-reading.</span>
          </div>
        </div>
      </header>

      {/* Main Structural Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Modern Nav Rail with visual indicators */}
        <div id="navigation-bar" className="flex flex-wrap gap-2 mb-8 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
          <button
            id="tab-btn-scheduler"
            onClick={() => setActiveTab("scheduler")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeTab === "scheduler"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Study Planner & Scheduler</span>
          </button>

          <button
            id="tab-btn-buddy"
            onClick={() => setActiveTab("buddy")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeTab === "buddy"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Study Buddy</span>
          </button>

          <button
            id="tab-btn-flashcards"
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeTab === "flashcards"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Recall Flashcards</span>
          </button>

          <button
            id="tab-btn-quiz"
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeTab === "quiz"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Quizzes</span>
          </button>

          <button
            id="tab-btn-pomodoro"
            onClick={() => setActiveTab("pomodoro")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
              activeTab === "pomodoro"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Focus Acoustics Timer</span>
          </button>
        </div>

        {/* Dynamic active sub-workspace component */}
        <div id="active-workspace-panel" className="transition-all duration-300">
          {activeTab === "scheduler" && <StudyScheduler />}
          {activeTab === "buddy" && <AIStudyBuddy />}
          {activeTab === "flashcards" && <FlashcardManager />}
          {activeTab === "quiz" && <QuizManager />}
          {activeTab === "pomodoro" && <PomodoroTimer />}
        </div>
      </main>

      {/* Subtle minimalist footer */}
      <footer className="mt-20 text-center text-slate-300 text-[10px] uppercase font-bold tracking-widest max-w-7xl mx-auto px-8 border-t border-slate-100 pt-6">
        <span>CK Exam Preparer • Designed for Active Learning</span>
      </footer>
    </div>
  );
}
