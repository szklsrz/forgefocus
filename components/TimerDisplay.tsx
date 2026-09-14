
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, SessionConfig, SessionRecord } from '../types';
import { SESSION_OPTIONS, SOUNDS } from '../constants';
import { saveSession, isTaskNameUniqueToday } from '../services/storage';

interface TimerDisplayProps {
  onSessionComplete?: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ onSessionComplete }) => {
  const [config, setConfig] = useState<SessionConfig>(SESSION_OPTIONS[3]); // Default 25/5
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(config.focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const baseTitleRef = useRef(document.title);

  const playSound = (type: 'success' | 'fail') => {
    const audio = new Audio(SOUNDS[type]);
    audio.play().catch(e => console.error("Audio play failed", e));
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completeSession = useCallback(() => {
    stopTimer();
    const endTime = new Date().toISOString();
    
    if (mode === 'focus') {
      const record: SessionRecord = {
        id: crypto.randomUUID(),
        taskName: taskName || 'Focus Session',
        startTime: sessionStartTime || new Date(Date.now() - config.focusTime * 60000).toISOString(),
        endTime: endTime,
        points: config.points,
        focusMinutes: config.focusTime,
        type: 'focus',
      };
      saveSession(record);
      playSound('success');
      
      // Notify parent component to refresh points
      if (onSessionComplete) {
        onSessionComplete();
      }
      
      // Auto switch to rest
      setMode('rest');
      setTimeLeft(config.restTime * 60);
      setSessionStartTime(endTime);
      setIsActive(false);
      setTaskName('');
    } else {
      playSound('fail');
      // After rest, reset to focus
      setMode('focus');
      setTimeLeft(config.focusTime * 60);
      setTaskName('');
      setSessionStartTime(null);
      setIsActive(false);
    }
  }, [mode, taskName, sessionStartTime, config, stopTimer]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      completeSession();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, completeSession]);

  useEffect(() => {
    const modeLabel = mode === 'focus' ? 'Focus' : 'Rest';
    const trimmedTaskName = taskName.trim();
    const taskSegment = trimmedTaskName ? ` • ${trimmedTaskName}` : '';
    document.title = `${formatTime(timeLeft)} • ${modeLabel}${taskSegment}`;

    return () => {
      document.title = baseTitleRef.current;
    };
  }, [timeLeft, mode, taskName]);

  const handleStart = () => {
    if (mode === 'focus') {
      if (!taskName.trim()) {
        setError('Give your quest a name!');
        return;
      }
      if (!isTaskNameUniqueToday(taskName)) {
        setError('Task name already used today!');
        return;
      }
    }
    setError(null);
    if (!sessionStartTime) setSessionStartTime(new Date().toISOString());
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    stopTimer();
    setTimeLeft(mode === 'focus' ? config.focusTime * 60 : config.restTime * 60);
  };

  const switchConfig = (newConfig: SessionConfig) => {
    stopTimer();
    setConfig(newConfig);
    setMode('focus');
    setTimeLeft(newConfig.focusTime * 60);
    setSessionStartTime(null);
  };

  const progress = 1 - (timeLeft / (mode === 'focus' ? config.focusTime * 60 : config.restTime * 60));

  return (
    <div className="max-w-xl mx-auto py-12 px-4 flex flex-col items-center pb-24 md:pb-12 text-center">
      {/* Session Type Selectors */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 w-full">
        {SESSION_OPTIONS.map((opt) => (
          <button
            key={opt.focusTime}
            onClick={() => switchConfig(opt)}
            disabled={isActive}
            className={`flex-1 min-w-[120px] duo-button px-4 py-3 rounded-2xl font-black text-sm border-2 transition-all ${
              config.focusTime === opt.focusTime
                ? 'bg-[#1cb0f6] text-white border-b-4 border-[#1899d6] border-x-[#1cb0f6] border-t-[#1cb0f6]'
                : 'bg-white text-[#777] border-[#e5e5e5] border-b-4 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {opt.focusTime}m / {opt.restTime}m
            <div className="text-[10px] uppercase opacity-75">{opt.label}</div>
          </button>
        ))}
      </div>

      {/* Main Timer Display */}
      <div className="relative h-72 mb-10 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="120"
            stroke="#e5e5e5"
            strokeWidth="16"
            fill="transparent"
          />
          <circle
            cx="144"
            cy="144"
            r="120"
            stroke={mode === 'focus' ? '#58cc02' : '#1cb0f6'}
            strokeWidth="16"
            strokeDasharray={754}
            strokeDashoffset={754 * (1 - progress)}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-[10px]">
          <span className="text-6xl font-black text-[#4b4b4b]">{formatTime(timeLeft)}</span>
          <span className={`text-sm font-black uppercase tracking-widest mt-2 ${mode === 'focus' ? 'text-[#58cc02]' : 'text-[#1cb0f6]'}`}>
            {mode === 'focus' ? 'Focus Time' : 'Rest Up'}
          </span>
        </div>
      </div>

      {/* Task Input */}
      {mode === 'focus' && !isActive && (
        <div className="w-full mb-8 relative">
           <input
             type="text"
             value={taskName}
             onChange={(e) => setTaskName(e.target.value)}
             placeholder="What is your mission?"
             className={`w-full px-6 py-4 rounded-2xl bg-white border-2 font-black text-lg text-black placeholder:text-gray-400 outline-none transition-all ${
               error ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] focus:border-[#1cb0f6]'
             }`}
           />
           {error && <p className="text-red-500 text-sm font-bold mt-2 ml-4 flex items-center justify-center gap-2">
             <i className="fa-solid fa-circle-exclamation"></i> {error}
           </p>}
        </div>
      )}

      {mode === 'focus' && isActive && (
         <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-[#4b4b4b] mb-1">Current Mission:</h2>
            <p className="text-[#1cb0f6] font-black text-lg uppercase tracking-tight">{taskName}</p>
         </div>
      )}

      {/* Controls */}
      <div className="flex gap-4 w-full">
        {!isActive ? (
          <button
            onClick={handleStart}
            className="flex-1 duo-button bg-[#58cc02] text-white px-8 py-4 rounded-2xl font-black text-xl border-b-4 border-[#46a302] hover:bg-[#61e002] active:translate-y-1 active:border-b-0"
          >
            START QUEST
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 duo-button bg-[#ff9600] text-white px-8 py-4 rounded-2xl font-black text-xl border-b-4 border-[#e68a00] hover:bg-[#ffa526] active:translate-y-1 active:border-b-0"
          >
            PAUSE
          </button>
        )}
        
        <button
          onClick={resetTimer}
          className="duo-button bg-white text-[#777] px-6 py-4 rounded-2xl font-black border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 active:translate-y-1 active:border-b-0"
        >
          <i className="fa-solid fa-rotate-right text-xl"></i>
        </button>
      </div>

      {/* Point Legend */}
      <div className="mt-12 w-full p-6 bg-[#ddf4ff] rounded-2xl border-2 border-[#84d8ff] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#1cb0f6]">
            <i className="fa-solid fa-award text-2xl"></i>
          </div>
          <div className="text-left">
            <p className="font-black text-[#1cb0f6]">Potential XP</p>
            <p className="text-xs text-[#1cb0f6] opacity-80">Earn points for every focus session!</p>
          </div>
        </div>
        <span className="text-2xl font-black text-[#1cb0f6]">+{config.points} XP</span>
      </div>
    </div>
  );
};

export default TimerDisplay;
