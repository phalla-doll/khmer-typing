'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Trophy, RotateCcw, Smile, User, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

const WORD_LISTS = {
  easy: "the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us".split(" "),
  medium: "try hand learn page over old should want thought still eye than few last sea change would mean people who any group such form water point great very point set sentence help where state low point write line cause point those place great spell turn help follow back around look right point through form write same move right boy long open hand old right also same form around many write hand old water back turn those look spell form group many line through people mean text some time what thing your good make word then use out look just test typing test khmer run fast quickly speed accuracy over many try hand learn".split(" "),
  hard: "algorithm asynchronous callback function recursive iteration loop object-oriented programming polymorphism inheritance encapsulation version control repository checkout continuous integration deployment pipeline containerization orchestration kubernetes replicas balancer injection vulnerability cross-site vulnerable endpoints architecture network hidden layers quantum computing superposition entanglement concurrency threading deadlocks algorithms optimization heuristic database schema migration normalization transactions rollback commit indexing querying fetching parsing rendering serialization encryption decryption authentication authorization middleware interceptors microservices modularity paradigms semantics typography semantics".split(" ")
};

const generateText = (difficulty: 'easy' | 'medium' | 'hard', length: number = 70) => {
  const words = WORD_LISTS[difficulty];
  let text = "";
  for (let i = 0; i < length; i++) {
    text += words[Math.floor(Math.random() * words.length)] + " ";
  }
  return text.trim();
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

export default function Home() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [targetText, setTargetText] = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize text first time
  useEffect(() => {
    setTargetText(generateText(difficulty));
  }, []);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    setTargetText(generateText(difficulty));
    setTimeLeft(timeLimit);
    setIsActive(false);
    setIsFinished(false);
    setInput("");
    setWpm(0);
    setAccuracy(100);
  }, [timeLimit, difficulty]);

  const reset = () => {
    setTargetText(generateText(difficulty));
    setInput("");
    setTimeLeft(timeLimit);
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    containerRef.current?.focus();
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Prevent default scrolling for spacebar
      if (e.key === ' ') {
        e.preventDefault();
      }

      if (isFinished) return;

      const key = e.key;

      if (!isActive && key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsActive(true);
      }

      if (key === 'Backspace') {
        setInput((prev) => prev.slice(0, -1));
        return;
      }

      if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Prevent typing past the length
        if (input.length < targetText.length) {
          setInput((prev) => prev + key);
        } else if (input.length === targetText.length && key === ' ') {
          setIsFinished(true);
        }
      }
    },
    [isActive, isFinished, input.length, targetText]
  );

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsFinished(true);
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isFinished]);

  // Calculate stats dynamically
  useEffect(() => {
    if (input.length > 0) {
      let correctChars = 0;
      for (let i = 0; i < input.length; i++) {
        if (input[i] === targetText[i]) {
          correctChars++;
        }
      }
      
      const acc = Math.round((correctChars / input.length) * 100);
      setAccuracy(acc);

      const timeElapsed = timeLimit - timeLeft;
      // WPM calculation only if time elapsed is somewhat reasonable to avoid Infinity
      if (timeElapsed > 0) {
        const currentWpm = Math.round((correctChars / 5) / (timeElapsed / 60));
        setWpm(currentWpm);
      }
    } else {
      setAccuracy(100);
      setWpm(0);
    }
  }, [input, timeLeft, timeLimit, targetText]);

  // Handle focus loss/gain to make sure we keep focus for typing
  useEffect(() => {
    const handleClick = () => {
      containerRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const renderText = () => {
    const chars = targetText.split('');
    return chars.map((char, index) => {
      let state = 'untyped';
      if (index < input.length) {
        state = input[index] === char ? 'correct' : 'incorrect';
      }

      const isCursor = index === input.length;

      return (
        <span
          key={index}
          className={cn(
            "relative transition-colors duration-100",
            state === 'untyped' && "text-[#BCB7AF]", // target light gray
            state === 'correct' && "text-[#434343]",
            state === 'incorrect' && "text-[#D27D6B] border-b-2 border-[#D27D6B]"
          )}
        >
          {isCursor && (
            <motion.span 
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
              className="absolute left-[-1px] bottom-[6px] top-[14px] w-[2px] bg-[#8A9A5B] rounded-full z-10" 
            />
          )}
          {char}
        </span>
      );
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center select-none outline-none"
      tabIndex={0}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
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
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E8E4DE] hover:bg-[#DDD9D2] border border-transparent hover:border-[#D1CEC8] shadow-sm outline-none active:scale-[0.98] transition-all duration-300">
            <Volume2 className="w-[18px] h-[18px] text-[#434343]/80" strokeWidth={2.5} />
          </button>
          <button className="px-5 py-2 rounded-full bg-[#E8E4DE] hover:bg-[#DDD9D2] border border-transparent hover:border-[#D1CEC8] text-[13px] tracking-wide text-[#434343] font-bold active:scale-[0.98] transition-all duration-300 flex items-center gap-2 shadow-sm">
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
            "font-mono text-[38px] leading-[1.65] tracking-tight relative -translate-x-[2px] overflow-hidden max-h-[190px]",
            isFinished && "opacity-50 blur-[2px] transition-all duration-300 pointer-events-none"
          )}
          style={{ wordSpacing: '0.15em' }}
        >
          {renderText()}
          {/* Append cursor at the end if fully typed */}
          {input.length === targetText.length && (
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

    </div>
  );
}
