'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX, Trophy, RotateCcw, Smile, User, Clock, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { normalizeKhmer, deleteBackward, compareTyping, computeTypingMetrics, splitClusters, type TypingComparison, type TypingUnitState } from 'khmer-segment';

const MOCK_LEADERBOARD = [
  { rank: 1, name: "typing_god", wpm: 154, acc: 99 },
  { rank: 2, name: "fast_fingers", wpm: 142, acc: 96 },
  { rank: 3, name: "qwerty_ninja", wpm: 138, acc: 98 },
  { rank: 4, name: "guest_8921", wpm: 125, acc: 94 },
  { rank: 5, name: "speed_demon", wpm: 119, acc: 100 },
];

const WORD_LISTS = {
  easy: "ខ្ញុំ អ្នក យើង គេ គាត់ ទៅ មក ញ៉ាំ បាយ ទឹក ផ្ទះ ល្អ មិន ទេ ដែល ថា មាន បាន និង ធ្វើ ការ ក្នុង មួយ ពី ដោយ នឹង ទី ជា អី ណា អ្នកណា ពេល ចង់ ត្រូវ ចេះ ចូល ចេញ ចុះ ឡើង លេង មើល ឃើញ ស្តាប់ ឮ សួរ ឆ្លើយ ដឹង គិត សរសេរ អាន រៀន".split(" "),
  medium: "សាលារៀន គ្រូបង្រៀន សិស្ស ប្រទេស កម្ពុជា សប្បាយចិត្ត ស្រឡាញ់ គ្រួសារ អរគុណ សួស្តី ការងារ បទពិសោធន៍ មហាវិទ្យាល័យ អនាគត ជីវិត សត្វ សមុទ្រ មេឃ ភ្លៀង ថ្ងៃនេះ ម្សិលមិញ ថ្ងៃស្អែក ឥឡូវនេះ ក្រុមហ៊ុន បច្ចេកវិទ្យា ព័ត៌មាន កុំព្យូទ័រ ទូរស័ព្ទ អ៊ីនធឺណិត សង្គម ទំនាក់ទំនង ពេលវេលា សំខាន់ បញ្ហា ដោះស្រាយ សេចក្តី ប្រាថ្នា".split(" "),
  hard: "ព្រះរាជាណាចក្រកម្ពុជា ក្រសួងអប់រំយុវជននិងកីឡា អភិវឌ្ឍន៍ ទំនាក់ទំនងសង្គម ទិដ្ឋភាពទូទៅ សុខុមាលភាព ប្រជាធិបតេយ្យ សេដ្ឋកិច្ចជាតិ វប្បធម៌ប្រពៃណី អរិយធម៌ ការចូលរួម ពិចារណា សច្ចធម៌ ផែនការយុទ្ធសាស្ត្រ ពាណិជ្ជកម្មអន្តរជាតិ សកលភាវូបនីយកម្ម កម្មសិទ្ធិបញ្ញា មូលធនបត្រ ហេដ្ឋារចនាសម្ព័ន្ធ កសិឧស្សាហកម្ម ទេសចរណ៍វប្បធម៌ ប្រវត្តិសាស្ត្រ សិទ្ធិមនុស្ស បរិស្ថានវិទ្យា ភូមិសាស្ត្រនយោបាយ ឧត្តមភាព".split(" ")
};

const generateText = (difficulty: 'easy' | 'medium' | 'hard', length: number = 70) => {
  const words = WORD_LISTS[difficulty];
  let text = "";
  for (let i = 0; i < length; i++) {
    text += words[Math.floor(Math.random() * words.length)] + " ";
  }
  return normalizeKhmer(text.trim());
};

function MagneticWrapper({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = e.currentTarget.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * 0.3);
    y.set(middleY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (typeof window === 'undefined') return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
      }
    }
    return !!this.ctx;
  }

  playClick(pitch: number = 1, muted: boolean) {
    if (muted) return;
    if (!this.init()) return;
    
    if (this.ctx!.state === 'suspended') this.ctx!.resume();

    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(400 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(100 * pitch, t + 0.05);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playError(muted: boolean) {
    if (muted) return;
    if (!this.init()) return;
    
    if (this.ctx!.state === 'suspended') this.ctx!.resume();

    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playFinish(muted: boolean) {
    if (muted) return;
    if (!this.init()) return;

    if (this.ctx!.state === 'suspended') this.ctx!.resume();

    const t = this.ctx!.currentTime;
    
    const playNote = (freq: number, startOff: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + startOff);
      
      gain.gain.setValueAtTime(0, t + startOff);
      gain.gain.linearRampToValueAtTime(0.1, t + startOff + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + startOff + 0.5);
      
      osc.start(t + startOff);
      osc.stop(t + startOff + 0.5);
    };

    playNote(523.25, 0); // C5
    playNote(659.25, 0.1); // E5
    playNote(783.99, 0.2); // G5
    playNote(1046.50, 0.3); // C6
  }
}

export default function Home() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [targetText, setTargetText] = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const soundManagerRef = useRef<SoundManager | null>(null);

  useEffect(() => {
    soundManagerRef.current = new SoundManager();
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize text first time
  useEffect(() => {
    setTargetText(generateText(difficulty));
  }, []);

  useEffect(() => {
    setTargetText(generateText(difficulty));
    setTimeLeft(timeLimit);
    setIsActive(false);
    setIsFinished(false);
    setInput("");
    if (inputRef.current) inputRef.current.value = "";
    setWpm(0);
    setAccuracy(100);
    setWpmHistory([]);
  }, [timeLimit, difficulty]);

  const reset = () => {
    setTargetText(generateText(difficulty));
    setInput("");
    if (inputRef.current) inputRef.current.value = "";
    setTimeLeft(timeLimit);
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setWpmHistory([]);
    inputRef.current?.focus();
  };

  const updateInputState = (newValRaw: string) => {
    const newVal = normalizeKhmer(newValRaw);
    
    const oldCmp = compareTyping(targetText, input);
    const newCmp = compareTyping(targetText, newVal);

    if (newVal.length < input.length) {
      if (newVal.length >= 0) {
        soundManagerRef.current?.playClick(0.7, isMuted);
      }
    } else if (newVal.length > input.length) {
      if (newCmp.correctPrefixLength > oldCmp.correctPrefixLength && newCmp.correctPrefixLength === newCmp.normalizedTyped.length) {
        soundManagerRef.current?.playClick(1.0 + (Math.random() * 0.1), isMuted);
      } else {
        soundManagerRef.current?.playError(isMuted);
      }
    }

    if (newCmp.isComplete && !isFinished) {
      soundManagerRef.current?.playFinish(isMuted);
      setTimeout(() => {
        setIsFinished(true);
        setIsActive(false);
      }, 0);
    }

    if (!isActive && newVal.length > 0) {
      setIsActive(true);
    }

    setInput(newVal);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) {
      if (inputRef.current) inputRef.current.value = input;
      return;
    }
    updateInputState(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFinished) {
      e.preventDefault();
      return;
    }
    
    if (e.key === 'Backspace' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      if (inputRef.current) {
        const currentVal = inputRef.current.value;
        if (currentVal.length > 0) {
          const nextVal = deleteBackward(currentVal, currentVal.length).text;
          inputRef.current.value = nextVal;
          updateInputState(nextVal);
        }
      }
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      soundManagerRef.current?.playFinish(isMuted);
      setIsFinished(true);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFinished, isMuted]);

  // Calculate stats dynamically using new khmer-segment 0.8.1 typing metrics
  useEffect(() => {
    if (input.length > 0) {
      const cmp = compareTyping(targetText, input);
      const timeElapsedMs = (timeLimit - timeLeft) * 1000;
      
      const metrics = computeTypingMetrics({
        correctCharCount: cmp.correctPrefixLength,
        totalTypedCharCount: cmp.normalizedTyped.length,
        elapsedMs: timeElapsedMs > 0 ? timeElapsedMs : 1000, 
      });

      setAccuracy(Math.round(metrics.accuracy));

      if (timeElapsedMs > 0) {
        const currentWpm = Math.round(metrics.wpm);
        setWpm(currentWpm);
        
        setWpmHistory(prev => {
          const timeElapsedSec = timeLimit - timeLeft;
          if (prev.length === 0) return [{ time: timeElapsedSec, wpm: currentWpm }];
          const last = prev[prev.length - 1];
          if (last.time === timeElapsedSec) {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { time: timeElapsedSec, wpm: currentWpm };
            return newHistory;
          } else {
            return [...prev, { time: timeElapsedSec, wpm: currentWpm }];
          }
        });
      }
    } else {
      setAccuracy(100);
      setWpm(0);
    }
  }, [input, timeLeft, timeLimit, targetText]);

  // Handle focus loss/gain to make sure we keep focus for typing
  useEffect(() => {
    const handleClick = () => {
      inputRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const targetClusters = useMemo(() => splitClusters(targetText), [targetText]);
  const inputClusters = useMemo(() => splitClusters(input), [input]);

  const renderText = () => {
    let currentWord: React.ReactNode[] = [];
    const words: React.ReactNode[][] = [];

    targetClusters.forEach((cluster, index) => {
      let state = 'untyped';
      if (index < inputClusters.length) {
        if (inputClusters[index] === cluster) {
          state = 'correct';
        } else {
          state = 'incorrect';
        }
      }

      const isCursor = index === inputClusters.length;
      const isSpace = cluster === ' ';
      const displayChar = isSpace ? '\u00A0' : cluster;

      const span = (
        <span
          key={index}
          className={cn(
            "relative transition-colors duration-100",
            state === 'untyped' && "text-[#BCB7AF]", 
            state === 'correct' && (isSpace ? "" : "text-[#434343]"),
            state === 'incorrect' && "text-[#D27D6B] bg-[#D27D6B]/20 rounded-[2px]" 
          )}
        >
          {isCursor && (
            <motion.span 
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
              className="absolute left-[0px] bottom-[6px] top-[14px] w-[2px] bg-[#8A9A5B] rounded-full z-10" 
            />
          )}
          {displayChar}
        </span>
      );

      currentWord.push(span);
      
      if (isSpace) {
        words.push(currentWord);
        currentWord = [];
      }
    });

    if (currentWord.length > 0) {
      words.push(currentWord);
    }

    return words.map((wordNodes, wIdx) => (
      <span key={wIdx} className="inline-block">
        {wordNodes}
      </span>
    ));
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center select-none outline-none"
    >
      <input 
        ref={inputRef}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      {/* Header */}
      <header className="w-full max-w-[1400px] px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="relative flex items-center justify-center w-[34px] h-[34px] rounded-lg bg-[#8A9A5B] shadow-[0_4px_10px_rgba(138,154,91,0.25),inset_0_2px_0_rgba(255,255,255,0.2)] border border-[#7A8A4B] group-active:scale-95 transition-transform duration-200">
            <span className="text-[#F5F2ED] font-mono font-bold text-[18px] -mt-1 tracking-tighter">K</span>
            <div className="absolute bottom-[6px] w-[14px] h-0.5 bg-[#F5F2ED]/60 rounded-full" />
          </div>
          <span className="text-[#434343] font-extrabold text-[24px] tracking-tight leading-none group-active:scale-[0.98] transition-transform duration-200">
            khmer<span className="text-[#8A9A5B]">typing</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-sm">
          <span className="text-[#434343] font-semibold">1,292,953</span>
          <span className="text-[#434343]/50 font-medium tracking-wide">tests completed</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              setIsMuted(!isMuted);
              inputRef.current?.focus();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E8E4DE] hover:bg-[#DDD9D2] border border-transparent hover:border-[#D1CEC8] shadow-sm outline-none active:scale-[0.98] transition-all duration-300"
          >
            {isMuted ? (
              <VolumeX className="w-[18px] h-[18px] text-[#434343]/80" strokeWidth={2.5} />
            ) : (
              <Volume2 className="w-[18px] h-[18px] text-[#434343]/80" strokeWidth={2.5} />
            )}
          </button>
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="px-5 py-2 rounded-full bg-[#E8E4DE] hover:bg-[#DDD9D2] border border-transparent hover:border-[#D1CEC8] text-[13px] tracking-wide text-[#434343] font-bold active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shadow-sm"
          >
            <Trophy className="w-4 h-4 text-[#434343]/80" />
            Leaderboards
          </button>
          <MagneticWrapper>
            <button className="px-[22px] py-2 rounded-full bg-[#434343] border border-[#434343] text-[#F5F2ED] text-[13px] tracking-wide font-bold hover:bg-[#2A2A2A] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)]">
              <User className="w-[15px] h-[15px] fill-current" />
              Profile
            </button>
          </MagneticWrapper>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[900px] flex flex-col justify-center px-8 relative -mt-20">
        
        {/* Top Info Bar */}
        <div className="flex items-end justify-between mb-8 opacity-90">
          <div className="text-[#434343]/50 text-sm font-medium tracking-wide">Start typing to begin...</div>
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#8A9A5B] tracking-tight">{timeLeft}</span>
              <span className="text-sm font-medium text-[#434343]/50">s</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#8A9A5B] tracking-tight">{wpm}</span>
              <span className="text-sm font-medium text-[#434343]/50">wpm</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#9A8B5B] tracking-tight">{accuracy}</span>
              <span className="text-sm font-medium text-[#434343]/50">% acc</span>
            </div>
          </div>
        </div>

        {/* Typing Area */}
        <div 
          className={cn(
            "google-sans-khmer text-[38px] leading-[1.65] tracking-normal relative -translate-x-[2px] overflow-hidden max-h-[188px]",
            isFinished && "opacity-50 blur-[2px] transition-all duration-300 pointer-events-none"
          )}
        >
          {renderText()}
          {/* Append cursor at the end if fully typed */}
          {inputClusters.length >= targetClusters.length && (
             <span className="relative">
               <motion.span 
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                  className="absolute left-[2px] bottom-[6px] top-[14px] w-[2px] bg-[#8A9A5B] rounded-full" 
                />
             </span>
          )}
        </div>

        {isFinished && (
          <div className="absolute inset-0 flex items-center justify-center z-10 animate-in fade-in zoom-in duration-300 pointer-events-none">
             <div className="bg-[#E8E4DE]/90 backdrop-blur-xl px-8 py-6 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] border border-[#D1CEC8]/50 flex flex-col items-center">
                 <div className="text-xl font-bold text-[#434343] mb-1 tracking-tight">Time's up!</div>
                 <div className="text-sm text-[#434343]/70 font-medium">You typed {wpm} WPM with {accuracy}% accuracy.</div>
                 <button onClick={reset} className="pointer-events-auto mt-6 flex items-center gap-2 bg-[#8A9A5B] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#7A8A4B] active:scale-[0.98] transition-all duration-300 shadow-lg border border-transparent">
                    <RotateCcw className="w-3.5 h-3.5" /> Try Again
                 </button>
             </div>
          </div>
        )}

        {/* WPM Chart Canvas */}
        {wpmHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 160, marginTop: 40 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full relative z-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wpmHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D1CEC8" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#BCB7AF" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}s`}
                />
                <YAxis 
                  stroke="#BCB7AF" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  width={40}
                />
                <Tooltip
                  cursor={{ stroke: '#BCB7AF', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: '#F5F2ED', borderRadius: '12px', border: '1px solid #D1CEC8', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                  itemStyle={{ color: '#8A9A5B', fontWeight: 'bold' }}
                  labelStyle={{ color: '#434343', fontWeight: '500', marginBottom: '4px' }}
                  formatter={(value: any) => [`${value} WPM`, 'Speed']}
                  labelFormatter={(label) => `${label} seconds`}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="#8A9A5B"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#8A9A5B', stroke: '#F5F2ED', strokeWidth: 2 }}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Bottom Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full mt-16 text-[13px] font-semibold tracking-wide gap-4 md:gap-0">
          <div className="flex items-center gap-1.5 md:gap-6">
            <div className="flex items-center gap-1.5 bg-[#E8E4DE]/50 rounded-full p-1 border border-transparent shadow-sm">
              {['easy', 'medium', 'hard'].map((d) => (
                <div 
                  key={d}
                  onClick={() => setDifficulty(d as 'easy' | 'medium' | 'hard')}
                  className={cn(
                    "px-4 py-2 cursor-pointer rounded-full transition-all duration-300 capitalize",
                    difficulty === d 
                      ? "bg-[#F5F2ED] text-[#434343] shadow-sm border border-[#D1CEC8]"
                      : "text-[#434343]/50 border border-transparent hover:text-[#434343]"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="w-px h-6 bg-[#D1CEC8] hidden md:block" />

            <div className="flex items-center gap-1.5">
              {[15, 30, 60].map((t) => (
                <div 
                  key={t}
                  onClick={() => setTimeLimit(t)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2 flex-shrink-0 cursor-pointer rounded-full transition-all duration-300 shadow-sm border",
                    timeLimit === t 
                      ? "bg-[#E8E4DE] text-[#434343] border-[#D1CEC8]"
                      : "text-[#434343]/50 border-transparent hover:text-[#434343] hover:bg-[#E8E4DE]/50"
                  )}
                >
                  <Clock className={cn("w-[14px] h-[14px]", timeLimit === t ? "text-[#8A9A5B]" : "text-current")} />
                  {t}s
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6 self-end md:self-auto">
            <button 
              onClick={reset} 
              className="flex items-center gap-2 text-[#434343]/50 hover:text-[#434343] active:scale-[0.96] transition-all duration-300 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
              Reset Stats
            </button>
            <MagneticWrapper>
              <button onClick={reset} className="flex items-center gap-2 bg-[#434343] text-[#F5F2ED] px-6 py-3 rounded-full font-bold hover:bg-[#2A2A2A] active:scale-[0.98] transition-all duration-300 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.15)]">
                <ChevronRight className="w-[15px] h-[15px]" strokeWidth={3} />
                Next Test
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </main>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F5F2ED]/60 backdrop-blur-md"
            onClick={() => setShowLeaderboard(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F5F2ED] w-full max-w-lg rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] overflow-hidden border border-[#D1CEC8]/60"
            >
              <div className="p-6 border-b border-[#D1CEC8]/50 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8A9A5B]/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-[#8A9A5B]" />
                  </div>
                  <div>
                    <h2 className="text-[#434343] font-bold text-xl tracking-tight leading-none mb-1">Leaderboards</h2>
                    <div className="text-xs text-[#434343]/50 font-medium tracking-wide uppercase">Global Top Typists</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLeaderboard(false)} 
                  className="p-2.5 bg-[#E8E4DE] rounded-full text-[#434343]/50 hover:text-[#434343] hover:bg-[#DDD9D2] active:scale-95 transition-all outline-none"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
              
              <div className="p-3">
                {MOCK_LEADERBOARD.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-4 hover:bg-[#E8E4DE]/50 rounded-2xl transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm", 
                        user.rank === 1 ? "bg-[#8A9A5B] text-white shadow-[#8A9A5B]/20" : 
                        user.rank === 2 ? "bg-[#BCB7AF] text-white" : 
                        user.rank === 3 ? "bg-[#D2A76B] text-white" : 
                        "bg-[#E8E4DE] text-[#434343]/50"
                      )}>
                        {user.rank}
                      </div>
                      <div className="font-bold text-[#434343] group-hover:text-[#8A9A5B] transition-colors">{user.name}</div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="font-bold text-[#8A9A5B] text-lg leading-none">{user.wpm} <span className="text-xs text-[#434343]/40 font-semibold tracking-wide">WPM</span></div>
                      </div>
                      <div className="text-right w-12">
                        <div className="font-bold text-[#434343]">{user.acc}<span className="text-[#434343]/40">%</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
