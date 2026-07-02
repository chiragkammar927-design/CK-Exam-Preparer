import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, CheckCircle, XCircle, RefreshCw, BarChart2, HelpCircle, Loader2, AlertCircle, Award } from "lucide-react";
import { Quiz, QuizQuestion } from "../types";

export default function QuizManager() {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Form states
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Quiz history state
  const [quizHistory, setQuizHistory] = useState<Array<{ id: string; topic: string; score: number; total: number; date: string }>>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("study_quiz_history");
    if (saved) {
      try {
        setQuizHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError("");
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numQuestions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz questions");

      const parsedQuestions: QuizQuestion[] = data.map((q: any) => ({
        id: "q_" + Math.random().toString(36).substr(2, 9),
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation
      }));

      const newQuiz: Quiz = {
        id: "quiz_" + Math.random().toString(36).substr(2, 9),
        title: `Quiz on ${topic}`,
        topic,
        questions: parsedQuestions
      };

      setActiveQuiz(newQuiz);
      setTopic("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswerRevealed) return;
    setSelectedOption(optionIndex);
  };

  const handleRevealAnswer = () => {
    if (selectedOption === null || !activeQuiz) return;
    setIsAnswerRevealed(true);

    // Track response index in questions
    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[currentQuestionIndex].selectedAnswerIndex = selectedOption;
    setActiveQuiz({
      ...activeQuiz,
      questions: updatedQuestions
    });
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      // Quiz complete! Calculate total score
      const totalCorrect = activeQuiz.questions.reduce((acc, q) => {
        return acc + (q.selectedAnswerIndex === q.correctAnswerIndex ? 1 : 0);
      }, 0);

      const finalQuiz: Quiz = {
        ...activeQuiz,
        score: totalCorrect,
        completedAt: new Date().toISOString()
      };

      setActiveQuiz(finalQuiz);

      // Save to history
      const newHistoryItem = {
        id: finalQuiz.id,
        topic: finalQuiz.topic,
        score: totalCorrect,
        total: finalQuiz.questions.length,
        date: new Date().toLocaleDateString()
      };

      const updatedHistory = [newHistoryItem, ...quizHistory];
      setQuizHistory(updatedHistory);
      localStorage.setItem("study_quiz_history", JSON.stringify(updatedHistory));
    }
  };

  const restartQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
  };

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
  const isLastQuestion = activeQuiz ? currentQuestionIndex === activeQuiz.questions.length - 1 : false;

  return (
    <div id="quiz-root-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sidebar: Quiz Generator Form & History */}
      <div id="quiz-left-sidebar" className="space-y-6">
        {/* Scribe Quiz Form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Quiz Scribe
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Test your active recall. Scribe generates custom multi-option quizzes on any topic or chapter with explanatory answer reviews.
          </p>

          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Study Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Krebs cycle, Python dictionaries..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Number of Questions</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      numQuestions === num
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
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
                  Generating Quiz...
                </>
              ) : (
                <>
                  <HelpCircle className="w-3.5 h-3.5" />
                  Generate Quiz
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

        {/* History scoreboard */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 mb-3.5 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            Performance History
          </h3>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {quizHistory.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{item.topic}</h4>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{item.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {item.score} / {item.total}
                  </span>
                </div>
              </div>
            ))}

            {quizHistory.length === 0 && (
              <div className="text-center text-slate-300 py-8 italic text-xs">
                No quizzes logged yet. Test yourself!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Column: Interactive Quiz Canvas */}
      <div id="quiz-main-arena" className="lg:col-span-2">
        {isGenerating ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px] gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <span className="text-sm font-semibold">Gemini is writing custom questions...</span>
            <p className="text-xs text-slate-400 max-w-sm">Generating premium educational options, verifying fact correctness, and composing custom explanations.</p>
          </div>
        ) : activeQuiz ? (
          /* ACTIVE PLAYING OR COMPLETED QUIZ */
          activeQuiz.score !== undefined ? (
            /* COMPLETED SCORESHEET */
            <div id="quiz-scoreboard-screen" className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                <Award className="w-8 h-8 fill-indigo-100" />
              </div>
              
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">Review Card Complete!</span>
                <h2 className="text-xl font-black text-slate-800">{activeQuiz.title}</h2>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 flex items-center gap-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
                  <span className="text-3xl font-black text-indigo-600">{activeQuiz.score} <span className="text-sm text-slate-400 font-medium">/ {activeQuiz.questions.length}</span></span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
                  <span className="text-3xl font-black text-slate-800">{Math.round((activeQuiz.score / activeQuiz.questions.length) * 100)}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {activeQuiz.score === activeQuiz.questions.length 
                  ? "Flawless score! You have masterfully retained this concept. Try generating a quiz with advanced topics next!"
                  : activeQuiz.score >= activeQuiz.questions.length / 2
                  ? "Great job! You possess a solid fundamental grasp. Do some focused flashcards on the harder items to seal the gaps."
                  : "Good effort! Repetition is the mother of all skills. Check the explanations and try this quiz again to master it."}
              </p>

              <button
                onClick={restartQuiz}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Test Another Topic</span>
              </button>
            </div>
          ) : (
            /* ACTIVE QUIZ PLAYING ARENA */
            currentQuestion && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                  <span>{Math.round((currentQuestionIndex / activeQuiz.questions.length) * 100)}% complete</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                  />
                </div>

                {/* Question Text */}
                <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                  {currentQuestion.question}
                </h3>

                {/* Options list */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    let optionStyle = "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50";
                    
                    if (isAnswerRevealed) {
                      const isCorrect = index === currentQuestion.correctAnswerIndex;
                      if (isCorrect) {
                        optionStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold";
                      } else if (isSelected) {
                        optionStyle = "bg-rose-50 border-rose-300 text-rose-800 font-semibold";
                      } else {
                        optionStyle = "bg-white border-slate-100 text-slate-400 opacity-60";
                      }
                    } else if (isSelected) {
                      optionStyle = "bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold";
                    }

                    return (
                      <div
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                            isSelected && !isAnswerRevealed
                              ? "bg-indigo-600 text-white"
                              : isAnswerRevealed && index === currentQuestion.correctAnswerIndex
                              ? "bg-emerald-500 text-white"
                              : isAnswerRevealed && isSelected
                              ? "bg-rose-500 text-white"
                              : "bg-white border border-slate-200 text-slate-500"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span>{option}</span>
                        </div>

                        {isAnswerRevealed && (
                          index === currentQuestion.correctAnswerIndex ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          ) : null
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Reveal & Action Buttons */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  {!isAnswerRevealed ? (
                    <button
                      onClick={handleRevealAnswer}
                      disabled={selectedOption === null}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      <span>Check Answer</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>{isLastQuestion ? "Finish Quiz" : "Next Question"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Educational Explanation Box */}
                {isAnswerRevealed && (
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-2 animate-fade-in">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Educational Review</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          )
        ) : (
          /* EMPTY STATE */
          <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center text-slate-300 flex flex-col items-center justify-center min-h-[350px]">
            <HelpCircle className="w-12 h-12 stroke-[1.25] mb-2" />
            <span className="text-sm font-semibold">Select or Generate a Quiz</span>
            <p className="text-xs text-slate-400 mt-1">Use the left panel to generate an active recall question sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
