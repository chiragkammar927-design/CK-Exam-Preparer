import React, { useState } from "react";
import { BookOpen, Sparkles, Send, Brain, Compass, HelpCircle, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { ChatMessage, ExplanationResponse } from "../types";

export default function AIStudyBuddy() {
  const [activeTab, setActiveTab] = useState<"explain" | "summarize" | "chat">("explain");
  
  // Explain concept states
  const [explainTopic, setExplainTopic] = useState("");
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState("");

  // Notes Summarizer states
  const [rawNotes, setRawNotes] = useState("");
  const [summaryOutput, setSummaryOutput] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState("");

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      content: "Hello! I am your AI Study Buddy. Ask me any study-related question, ask for mnemonics to memorize hard facts, or paste a complex formula for a clear breakdown! 📚✨",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState("");

  // Copy helper
  const [copiedText, setCopiedText] = useState("");
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // 1. Handle Explain Topic
  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainTopic.trim()) return;

    setIsExplaining(true);
    setExplainError("");
    setExplanation(null);

    try {
      const res = await fetch("/api/explain-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: explainTopic })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to explain topic");
      setExplanation(data);
    } catch (err: any) {
      setExplainError(err.message || "An unexpected error occurred.");
    } finally {
      setIsExplaining(false);
    }
  };

  // 2. Handle Summarize Notes
  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;

    setIsSummarizing(true);
    setSummarizeError("");
    setSummaryOutput("");

    try {
      // We can use the chat endpoint or a general prompt proxy for quick notes summarization.
      // Let's call /api/chat with a special notes summarizer command structure to keep it robust and save backend endpoints.
      const prompt = `Please summarize the following educational study notes into a beautifully structured, clean Markdown study guide. Include:
1. Core Definitions & Terms (as bolded key-value pairs)
2. Main Concept Explanations
3. Fast Mnemonics or Study tips
Keep the formatting professional and highly scannable.

Notes:
${rawNotes}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ id: "temp_summary", sender: "user", content: prompt, timestamp: "" }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize notes");
      setSummaryOutput(data.reply);
    } catch (err: any) {
      setSummarizeError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // 3. Handle Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      sender: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsSendingChat(true);
    setChatError("");

    try {
      const updatedMessages = [...chatMessages, userMessage];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      setChatMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setChatError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div id="ai-study-buddy-root" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col md:flex-row">
      {/* Sidebar Nav (Interactive Tab Pillar) */}
      <div id="ai-buddy-sidebar" className="md:w-64 bg-slate-50 border-r border-slate-100 p-4 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 justify-around md:justify-start">
        <button
          onClick={() => setActiveTab("explain")}
          className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
            activeTab === "explain"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Explain Concept</span>
        </button>

        <button
          onClick={() => setActiveTab("summarize")}
          className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
            activeTab === "summarize"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Notes Summarizer</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
            activeTab === "chat"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Interactive Chat</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div id="ai-buddy-main-content" className="flex-1 p-6 md:p-8 flex flex-col min-h-[450px]">
        {/* TAB 1: EXPLAIN A CONCEPT */}
        {activeTab === "explain" && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                Concept Explainer
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Enter any academic topic or complex idea. The AI breaks it down into intuitive simplified levels, a memorable analogy, and an academic deep-dive explanation.
              </p>

              <form onSubmit={handleExplain} className="flex gap-2.5 mb-6">
                <input
                  type="text"
                  value={explainTopic}
                  onChange={(e) => setExplainTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Quantum Entanglement, Supply & Demand..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isExplaining}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-75"
                >
                  {isExplaining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Explain
                    </>
                  )}
                </button>
              </form>

              {explainError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{explainError}</span>
                </div>
              )}

              {/* Multi-depth Explanations Grid */}
              {explanation && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Simple Level */}
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 block mb-1">Explain like I'm 5</span>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">Simplified View</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{explanation.simple}</p>
                    </div>

                    {/* Analogy */}
                    <div className="bg-sky-50/40 border border-sky-100 rounded-2xl p-5">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-sky-600 block mb-1">Conceptual Analogy</span>
                      <h4 className="text-sm font-bold text-slate-800 mb-2">In Real World Terms</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{explanation.analogy}</p>
                    </div>
                  </div>

                  {/* Deep Dive */}
                  <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 block mb-1">Deep Academic Level</span>
                    <h4 className="text-sm font-bold text-slate-800 mb-2">Technical Breakdown</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{explanation.deep}</p>
                  </div>

                  {/* Takeaways */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-slate-500" />
                      Key Exam Takeaways
                    </h4>
                    <ul className="space-y-2 list-disc list-inside text-xs text-slate-600">
                      {explanation.keyTakeaways.map((point, index) => (
                        <li key={index} className="leading-relaxed">{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {!explanation && !isExplaining && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-300">
                <Brain className="w-12 h-12 stroke-[1.25] mb-2" />
                <span className="text-xs">Awaiting an academic topic...</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTES SUMMARIZER */}
        {activeTab === "summarize" && (
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Study Notes Summarizer
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Paste your textbooks chapters, lecture slides transcripts, or messy raw personal notes. AI filters out fluff and creates a structured study guide with definitions and insights.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              {/* Raw Input */}
              <form onSubmit={handleSummarize} className="flex flex-col space-y-4">
                <textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder="Paste textbook text, lecture notes, transcript, or outlines here (max 5,000 characters)..."
                  className="w-full flex-1 min-h-[220px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-sans"
                  maxLength={5000}
                  required
                />
                
                <button
                  type="submit"
                  disabled={isSummarizing || !rawNotes.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Structuring Study Guide...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Study Guide
                    </>
                  )}
                </button>
              </form>

              {/* Summarized Output */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-5 flex flex-col min-h-[220px] relative">
                {summaryOutput && (
                  <button
                    onClick={() => handleCopy(summaryOutput, "summary")}
                    className="absolute top-4 right-4 p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    title="Copy Study Guide"
                  >
                    {copiedText === "summary" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}

                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">Generated Guide</div>
                
                {isSummarizing && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="text-xs">Mining critical concepts...</span>
                  </div>
                )}

                {summarizeError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{summarizeError}</span>
                  </div>
                )}

                {!summaryOutput && !isSummarizing && !summarizeError && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-12">
                    <BookOpen className="w-10 h-10 stroke-[1.25] mb-2" />
                    <span className="text-xs text-center px-4">Submit notes on the left to synthesize key takeaways.</span>
                  </div>
                )}

                {summaryOutput && !isSummarizing && (
                  <div className="flex-1 overflow-y-auto text-xs text-slate-600 whitespace-pre-line leading-relaxed max-h-[300px] pr-2">
                    {summaryOutput}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDY CHAT */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col justify-between h-full min-h-[400px]">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Study Companion Chat
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Chat dynamically with an empathetic tutor who can test your knowledge, write clever mnemonics, or explain math equations.
              </p>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 border border-slate-100 rounded-2xl p-4 bg-slate-50/50 mb-4 overflow-y-auto max-h-[280px] flex flex-col space-y-3.5 pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"
                    }`}
                  >
                    <span className="whitespace-pre-line">{msg.content}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              
              {isSendingChat && (
                <div className="self-start flex items-center space-x-1.5 bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-none text-xs text-slate-400 max-w-[85%]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Scribing response...</span>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2 self-stretch">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{chatError}</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your tutor anything..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                disabled={isSendingChat}
                required
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
