import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Volume2, VolumeX, Flame, Award, BookOpen } from "lucide-react";

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  
  // Stats state from localStorage
  const [stats, setStats] = useState({
    totalFocusMinutes: 0,
    sessionsCompleted: 0,
    streak: 0,
    lastStudyDate: ""
  });

  // Sound generator state
  const [soundMode, setSoundMode] = useState<"none" | "white" | "brown" | "binaural">("none");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Load stats
  useEffect(() => {
    const saved = localStorage.getItem("study_pomodoro_stats");
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Timer intervals
  useEffect(() => {
    let intervalId: any = null;

    if (isActive) {
      intervalId = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished!
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isActive, minutes, seconds]);

  // Sync mode timer lengths
  const getModeDuration = (targetMode: "focus" | "shortBreak" | "longBreak") => {
    switch (targetMode) {
      case "focus": return 25;
      case "shortBreak": return 5;
      case "longBreak": return 15;
    }
  };

  const changeMode = (newMode: "focus" | "shortBreak" | "longBreak") => {
    setIsActive(false);
    setMode(newMode);
    setMinutes(getModeDuration(newMode));
    setSeconds(0);
  };

  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Play synthesis buzzer sound
    playBuzzer();

    if (mode === "focus") {
      const addedMinutes = getModeDuration("focus");
      const todayStr = new Date().toDateString();
      
      setStats(prev => {
        const isNewDay = prev.lastStudyDate !== todayStr;
        const newStreak = isNewDay 
          ? (prev.lastStudyDate === new Date(Date.now() - 86400000).toDateString() ? prev.streak + 1 : 1)
          : prev.streak || 1;

        const updated = {
          totalFocusMinutes: prev.totalFocusMinutes + addedMinutes,
          sessionsCompleted: prev.sessionsCompleted + 1,
          streak: newStreak,
          lastStudyDate: todayStr
        };
        localStorage.setItem("study_pomodoro_stats", JSON.stringify(updated));
        return updated;
      });

      // Alert & switch mode automatically to shortBreak
      changeMode("shortBreak");
    } else {
      changeMode("focus");
    }
  };

  // Browser-native synthesis audio buzzer
  const playBuzzer = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); // A5
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("AudioContext buzzer error: ", e);
    }
  };

  // Synthesize custom Focus sounds dynamically
  const startFocusNoise = (type: "white" | "brown" | "binaural") => {
    try {
      stopFocusNoise();

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === "white") {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      } else if (type === "brown") {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Compensate loss of volume
        }
      } else if (type === "binaural") {
        // Simple ambient hum
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const gainNode = ctx.createGain();

        oscLeft.frequency.value = 150; // Left ear
        oscRight.frequency.value = 160; // Right ear (10Hz binaural beat difference for focus!)

        gainNode.gain.value = 0.15;

        if (pannerLeft && pannerRight) {
          pannerLeft.pan.value = -1;
          pannerRight.pan.value = 1;
          oscLeft.connect(pannerLeft).connect(gainNode);
          oscRight.connect(pannerRight).connect(gainNode);
        } else {
          oscLeft.connect(gainNode);
          oscRight.connect(gainNode);
        }

        gainNode.connect(ctx.destination);
        oscLeft.start();
        oscRight.start();

        // Save oscillators as a custom container object
        noiseNodeRef.current = gainNode;
        return;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = type === "brown" ? 400 : 1000;

      const gain = ctx.createGain();
      gain.gain.value = type === "brown" ? 0.25 : 0.08;

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      noiseNodeRef.current = noiseSource;
    } catch (err) {
      console.warn("Failed to generate focus noise: ", err);
    }
  };

  const stopFocusNoise = () => {
    if (noiseNodeRef.current) {
      try {
        (noiseNodeRef.current as any).stop?.();
        (noiseNodeRef.current as any).disconnect?.();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const handleSoundChange = (type: "none" | "white" | "brown" | "binaural") => {
    setSoundMode(type);
    if (type === "none") {
      stopFocusNoise();
    } else {
      startFocusNoise(type);
    }
  };

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      stopFocusNoise();
    };
  }, []);

  const totalDuration = getModeDuration(mode) * 60;
  const currentSecondsLeft = minutes * 60 + seconds;
  const progressPercentage = ((totalDuration - currentSecondsLeft) / totalDuration) * 100;

  return (
    <div id="pomodoro-timer-section" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Timer Display Card */}
      <div id="pomodoro-main-card" className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        {/* Progress Background bar */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-indigo-600 transition-all duration-1000" 
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Mode Selector pills */}
        <div id="pomodoro-mode-selector" className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-8 z-10">
          <button
            id="mode-btn-focus"
            onClick={() => changeMode("focus")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === "focus" 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Focus Session (25m)
          </button>
          <button
            id="mode-btn-short"
            onClick={() => changeMode("shortBreak")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === "shortBreak" 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Short Break (5m)
          </button>
          <button
            id="mode-btn-long"
            onClick={() => changeMode("longBreak")}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              mode === "longBreak" 
                ? "bg-white text-amber-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Circular Ring Timer Visualizer */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              className="stroke-slate-100 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              className={`fill-none transition-all duration-1000 ${
                mode === "focus" ? "stroke-indigo-600" : mode === "shortBreak" ? "stroke-emerald-500" : "stroke-amber-500"
              }`}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 110}
              strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercentage / 100)}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span id="timer-numbers" className="text-5xl font-bold tracking-tight text-slate-800 font-mono">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase font-semibold tracking-widest text-slate-400 mt-2">
              {mode === "focus" ? "Focusing" : "Resting"}
            </span>
          </div>
        </div>

        {/* Play/Pause Controls */}
        <div className="flex items-center space-x-4 z-10">
          <button
            id="timer-reset-button"
            onClick={() => {
              setIsActive(false);
              setMinutes(getModeDuration(mode));
              setSeconds(0);
            }}
            className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            id="timer-play-pause-button"
            onClick={() => setIsActive(!isActive)}
            className={`p-5 rounded-full text-white shadow-md hover:scale-105 active:scale-95 transition-all ${
              mode === "focus" 
                ? "bg-indigo-600 hover:bg-indigo-700" 
                : mode === "shortBreak" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          {/* Sound options inside the card */}
          <div className="relative group">
            <button
              id="focus-sound-control"
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center"
              title="Focus Sounds"
            >
              {soundMode === "none" ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-indigo-600" />}
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white rounded-xl p-2 shadow-lg hidden group-hover:block z-20 min-w-[120px]">
              <div className="text-[10px] text-slate-400 font-semibold px-2 pb-1 text-center border-b border-slate-800 uppercase tracking-wider">Focus Noise</div>
              <button onClick={() => handleSoundChange("none")} className={`w-full text-left px-3 py-1 text-xs rounded hover:bg-slate-800 mt-1 ${soundMode === "none" ? "text-indigo-400 font-semibold" : "text-white"}`}>None</button>
              <button onClick={() => handleSoundChange("white")} className={`w-full text-left px-3 py-1 text-xs rounded hover:bg-slate-800 ${soundMode === "white" ? "text-indigo-400 font-semibold" : "text-white"}`}>White Noise</button>
              <button onClick={() => handleSoundChange("brown")} className={`w-full text-left px-3 py-1 text-xs rounded hover:bg-slate-800 ${soundMode === "brown" ? "text-indigo-400 font-semibold" : "text-white"}`}>Brown Noise</button>
              <button onClick={() => handleSoundChange("binaural")} className={`w-full text-left px-3 py-1 text-xs rounded hover:bg-slate-800 ${soundMode === "binaural" ? "text-indigo-400 font-semibold" : "text-white"}`}>Binaural Beats</button>
            </div>
          </div>
        </div>
      </div>

      {/* Pomodoro Stats & Sound Explainer Card */}
      <div id="pomodoro-sidebar-card" className="flex flex-col space-y-6">
        {/* Focus Stats */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between h-48">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-200">Study Streak</span>
            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold">{stats.streak} days</span>
            </div>
          </div>
          <div>
            <span className="text-4xl font-extrabold tracking-tight block">{stats.totalFocusMinutes}</span>
            <span className="text-xs text-indigo-200">Total study minutes logged</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-indigo-300">
            <Award className="w-4 h-4" />
            <span>Completed {stats.sessionsCompleted} focus sessions</span>
          </div>
        </div>

        {/* Ambient Noise Explainer */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Focus Acoustics
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Synthesize client-side acoustic noise to mask distracting ambient sounds. Binaural beats send a 150Hz frequency to the left speaker and 160Hz to the right speaker, promoting 10Hz Alpha brainwaves ideal for active focus and memory recall.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Web Audio APIs</span>
            <span>🎧 Headphone recommended</span>
          </div>
        </div>
      </div>
    </div>
  );
}
