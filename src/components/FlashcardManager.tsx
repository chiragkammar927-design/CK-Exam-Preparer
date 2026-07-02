import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, ArrowRight, RefreshCw, Layers, Sparkles, BookOpen, Check, Brain, Loader2, AlertCircle } from "lucide-react";
import { Flashcard, FlashcardDeck } from "../types";

export default function FlashcardManager() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  
  // Create deck modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");

  // AI Generation states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [aiError, setAiError] = useState("");

  // Add individual manual card state
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");

  // Active recall practice state
  const [isPracticing, setIsPracticing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load decks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("study_flashcard_decks");
    if (saved) {
      try {
        setDecks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed with a default deck
      const defaultDeck: FlashcardDeck = {
        id: "default-1",
        name: "Welcome to Flashcards",
        description: "An intro deck displaying spaced repetition flashcard features.",
        createdAt: new Date().toISOString(),
        cards: [
          {
            id: "card-1",
            front: "What is Active Recall?",
            back: "Active Recall is a highly efficient learning method where you actively stimulate your memory during the learning process, forcing your brain to retrieve information rather than passively rereading it.",
            easeFactor: 2.5,
            interval: 1,
            nextReviewDate: new Date().toISOString()
          },
          {
            id: "card-2",
            front: "What is Spaced Repetition (SRS)?",
            back: "Spaced Repetition is a memory-hacking method where cards are reviewed at increasing intervals (e.g. 1 day, 3 days, 7 days). Harder items are seen more frequently, while easier items are spaced further apart.",
            easeFactor: 2.5,
            interval: 1,
            nextReviewDate: new Date().toISOString()
          }
        ]
      };
      setDecks([defaultDeck]);
      localStorage.setItem("study_flashcard_decks", JSON.stringify([defaultDeck]));
    }
  }, []);

  // Save utility helper
  const saveDecks = (updatedDecks: FlashcardDeck[]) => {
    setDecks(updatedDecks);
    localStorage.setItem("study_flashcard_decks", JSON.stringify(updatedDecks));
  };

  // Get current active deck
  const activeDeck = decks.find(d => d.id === selectedDeckId);

  // Handle deck creation
  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    const newDeck: FlashcardDeck = {
      id: "deck_" + Math.random().toString(36).substr(2, 9),
      name: newDeckName,
      description: newDeckDesc,
      cards: [],
      createdAt: new Date().toISOString()
    };

    const updated = [newDeck, ...decks];
    saveDecks(updated);
    
    setNewDeckName("");
    setNewDeckDesc("");
    setShowCreateModal(false);
    setSelectedDeckId(newDeck.id);
  };

  // Delete Deck
  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this deck?")) {
      const updated = decks.filter(d => d.id !== deckId);
      saveDecks(updated);
      if (selectedDeckId === deckId) {
        setSelectedDeckId(null);
        setIsPracticing(false);
      }
    }
  };

  // Add individual manual card
  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !newCardFront.trim() || !newCardBack.trim()) return;

    const newCard: Flashcard = {
      id: "card_" + Math.random().toString(36).substr(2, 9),
      front: newCardFront,
      back: newCardBack,
      easeFactor: 2.5,
      interval: 1,
      nextReviewDate: new Date().toISOString()
    };

    const updated = decks.map(d => {
      if (d.id === selectedDeckId) {
        return {
          ...d,
          cards: [...d.cards, newCard]
        };
      }
      return d;
    });

    saveDecks(updated);
    setNewCardFront("");
    setNewCardBack("");
  };

  // Generate Flashcards using AI
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim() || !selectedDeckId) return;

    setIsGeneratingCards(true);
    setAiError("");

    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate flashcards");

      const generatedCards: Flashcard[] = data.map((item: any) => ({
        id: "card_" + Math.random().toString(36).substr(2, 9),
        front: item.front,
        back: item.back,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: new Date().toISOString()
      }));

      const updated = decks.map(d => {
        if (d.id === selectedDeckId) {
          return {
            ...d,
            cards: [...d.cards, ...generatedCards]
          };
        }
        return d;
      });

      saveDecks(updated);
      setAiTopic("");
      setShowAiModal(false);
    } catch (err: any) {
      setAiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGeneratingCards(false);
    }
  };

  // Delete Individual Card
  const handleDeleteCard = (cardId: string) => {
    if (!selectedDeckId) return;
    const updated = decks.map(d => {
      if (d.id === selectedDeckId) {
        return {
          ...d,
          cards: d.cards.filter(c => c.id !== cardId)
        };
      }
      return d;
    });
    saveDecks(updated);
  };

  // Spaced Repetition Rating Feedback
  const handleRateRecall = (quality: "hard" | "good" | "easy") => {
    if (!activeDeck) return;
    const currentCard = activeDeck.cards[currentCardIndex];
    if (!currentCard) return;

    let nextInterval = currentCard.interval;
    let nextEaseFactor = currentCard.easeFactor;

    if (quality === "hard") {
      nextInterval = 1; // Show tomorrow
      nextEaseFactor = Math.max(1.3, currentCard.easeFactor - 0.2);
    } else if (quality === "good") {
      nextInterval = Math.round(currentCard.interval * 2);
    } else {
      nextInterval = Math.round(currentCard.interval * 3);
      nextEaseFactor = currentCard.easeFactor + 0.15;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + nextInterval);

    // Save updated card details
    const updatedDecks = decks.map(d => {
      if (d.id === selectedDeckId) {
        return {
          ...d,
          cards: d.cards.map((c, i) => {
            if (i === currentCardIndex) {
              return {
                ...c,
                interval: nextInterval,
                easeFactor: nextEaseFactor,
                nextReviewDate: nextReview.toISOString()
              };
            }
            return c;
          })
        };
      }
      return d;
    });

    saveDecks(updatedDecks);

    // Advance index
    if (currentCardIndex + 1 < activeDeck.cards.length) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
      }, 200);
    } else {
      // Finished practice!
      alert("Deck Review Complete! Excellent job reviewing your facts! 🎉");
      setIsPracticing(false);
      setIsFlipped(false);
      setCurrentCardIndex(0);
    }
  };

  return (
    <div id="flashcard-root-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: List of Decks */}
      <div id="decks-sidebar-panel" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col h-full min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Flashcard Decks
          </h3>
          <button
            id="create-deck-modal-btn"
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 hover:bg-slate-50 text-indigo-600 border border-slate-100 rounded-lg transition-colors"
            title="Create New Deck"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Create Deck Form (Inline simple) */}
        {showCreateModal && (
          <form onSubmit={handleCreateDeck} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl mb-4 space-y-2">
            <input
              type="text"
              placeholder="Deck Name (e.g., Biology Terminology)"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Short Description (optional)"
              value={newDeckDesc}
              onChange={(e) => setNewDeckDesc(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Decks List */}
        <div id="decks-item-list" className="space-y-2 flex-1 overflow-y-auto max-h-[350px]">
          {decks.map((deck) => (
            <div
              key={deck.id}
              onClick={() => {
                setSelectedDeckId(deck.id);
                setIsPracticing(false);
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                selectedDeckId === deck.id
                  ? "bg-indigo-50/30 border-indigo-200/80"
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800">{deck.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{deck.description || "No description"}</p>
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-2 bg-indigo-50 px-1.5 py-0.5 rounded w-max">
                  <BookOpen className="w-3 h-3" />
                  <span>{deck.cards.length} cards</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteDeck(deck.id, e)}
                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                title="Delete Deck"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {decks.length === 0 && (
            <div className="text-center text-slate-300 text-xs py-12">
              No decks created yet. Click "+" to start!
            </div>
          )}
        </div>
      </div>

      {/* Main Flashcard Work Area */}
      <div id="flashcards-main-workspace" className="lg:col-span-2">
        {activeDeck ? (
          <div className="space-y-6">
            {/* Header Details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">{activeDeck.name}</h2>
                <p className="text-xs text-slate-500">{activeDeck.description || "Active recall decks"}</p>
              </div>

              <div className="flex gap-2">
                <button
                  id="open-ai-generation-btn"
                  onClick={() => setShowAiModal(true)}
                  className="px-3 py-1.5 border border-indigo-100 hover:border-indigo-200 text-indigo-600 text-xs font-semibold rounded-xl bg-indigo-50/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Generate Cards</span>
                </button>

                {activeDeck.cards.length > 0 && (
                  <button
                    id="start-practice-btn"
                    onClick={() => {
                      setIsPracticing(!isPracticing);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                    }}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>{isPracticing ? "Edit Mode" : "Start Active Recall"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI Generator Modal inline */}
            {showAiModal && (
              <div className="bg-indigo-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
                <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  AI Flashcard Scribe
                </h3>
                <p className="text-xs text-indigo-200 mb-4 leading-relaxed">
                  Enter a general study topic (e.g. "French Revolution timeline", "Core Mitochondria pathways"). Gemini will synthesize 8 highly targeted cards with core study questions and detailed answers.
                </p>

                <form onSubmit={handleAiGenerate} className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Enter flashcard topic or concept..."
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-xs placeholder-indigo-300/60 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 text-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isGeneratingCards}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1 disabled:opacity-75"
                  >
                    {isGeneratingCards ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>
                </form>

                {aiError && (
                  <div className="p-3 bg-rose-500/20 text-rose-200 rounded-xl text-xs flex items-center gap-2 mt-3 border border-rose-500/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowAiModal(false)}
                  className="absolute top-4 right-4 text-xs text-indigo-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            )}

            {/* ACTIVE RECALL INTERACTIVE PRACTICE SHIELD */}
            {isPracticing && activeDeck.cards.length > 0 ? (
              <div id="practice-arena" className="flex flex-col items-center justify-center space-y-6 py-6">
                <div className="text-[11px] uppercase font-bold tracking-widest text-slate-400">
                  Reviewing Card {currentCardIndex + 1} of {activeDeck.cards.length}
                </div>

                {/* Flippable 3D Card Box */}
                <div
                  id="flippable-card-container"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full max-w-lg h-72 cursor-pointer perspective-1000 select-none group"
                >
                  <div
                    id="card-flipper-inner"
                    className={`relative w-full h-full duration-500 transform-style-3d shadow-md rounded-2xl border border-slate-100 ${
                      isFlipped ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* Front Face */}
                    <div className="absolute inset-0 w-full h-full bg-white rounded-2xl backface-hidden p-8 flex flex-col justify-between items-center text-center">
                      <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                        Question / Concept
                      </div>
                      <p className="text-base font-bold text-slate-800 px-4">
                        {activeDeck.cards[currentCardIndex]?.front}
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        <span>Click card to reveal answer</span>
                      </div>
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 w-full h-full bg-indigo-600 rounded-2xl backface-hidden rotate-y-180 p-8 flex flex-col justify-between items-center text-center text-white">
                      <div className="text-[10px] bg-white/20 text-indigo-100 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Answer / Explanation
                      </div>
                      <p className="text-sm font-semibold leading-relaxed px-4 overflow-y-auto max-h-40">
                        {activeDeck.cards[currentCardIndex]?.back}
                      </p>
                      <div className="text-[10px] text-indigo-200 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        <span>Click to see question again</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active recall evaluation controls */}
                {isFlipped ? (
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">How was your recall?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRateRecall("hard")}
                        className="px-4 py-2 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-600 font-semibold text-xs rounded-xl transition-colors"
                      >
                        🔴 Hard (Show Again)
                      </button>
                      <button
                        onClick={() => handleRateRecall("good")}
                        className="px-4 py-2 border border-slate-200 bg-slate-50/30 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-colors"
                      >
                        ⚪ Good (Spaced interval)
                      </button>
                      <button
                        onClick={() => handleRateRecall("easy")}
                        className="px-4 py-2 border border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50 text-emerald-600 font-semibold text-xs rounded-xl transition-colors"
                      >
                        🟢 Easy (Space wider)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-10 text-xs text-slate-400 italic">Review the card first, then grade yourself.</div>
                )}
              </div>
            ) : (
              /* CARD BUILDER / EDIT MODE */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Add manual Card Form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm h-max">
                  <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Add Manual Card
                  </h3>
                  <form onSubmit={handleAddManualCard} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">FRONT (Question or Term)</label>
                      <textarea
                        value={newCardFront}
                        onChange={(e) => setNewCardFront(e.target.value)}
                        placeholder="e.g. What is the powerhouse of the cell?"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-20"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">BACK (Answer or Explanation)</label>
                      <textarea
                        value={newCardBack}
                        onChange={(e) => setNewCardBack(e.target.value)}
                        placeholder="e.g. The Mitochondrion is responsible for generating cellular energy."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-24"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors"
                    >
                      Add Card
                    </button>
                  </form>
                </div>

                {/* Cards List Display */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 mb-4">Cards in Deck ({activeDeck.cards.length})</h3>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {activeDeck.cards.map((card) => (
                      <div key={card.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start justify-between text-xs gap-3">
                        <div className="flex-1">
                          <span className="font-bold text-slate-700">Q: {card.front}</span>
                          <p className="text-slate-500 mt-1 italic">A: {card.back}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {activeDeck.cards.length === 0 && (
                      <div className="text-center py-12 text-slate-300 italic text-xs">
                        This deck is currently empty. Write some cards or generate them with AI!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center text-slate-300 flex flex-col items-center justify-center min-h-[350px]">
            <Layers className="w-12 h-12 stroke-[1.25] mb-2" />
            <span className="text-sm font-semibold">Select or Create a Deck</span>
            <p className="text-xs text-slate-400 mt-1">Choose a flashcard deck from the sidebar to review or edit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
