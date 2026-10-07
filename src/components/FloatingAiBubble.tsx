import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, MessageSquare, Move } from 'lucide-react';

interface FloatingAiBubbleProps {
  onOpenAi: () => void;
  activeMomentTitle?: string;
  isOpen?: boolean;
}

export const FloatingAiBubble: React.FC<FloatingAiBubbleProps> = ({
  onOpenAi,
  activeMomentTitle,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('fk_floating_ai_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    // Default: bottom right with good safe margin from mobile bottom bars
    return {
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 180) : 200,
      y: typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 150) : 400,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Keep inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(16, window.innerWidth - 170);
        const maxY = Math.max(60, window.innerHeight - 100);
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(60, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save position when drag ends
  const savePosition = (x: number, y: number) => {
    try {
      localStorage.setItem('fk_floating_ai_pos', JSON.stringify({ x, y }));
    } catch {}
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragStartRef.current.moved = true;
      }
      const newX = Math.min(Math.max(12, dragStartRef.current.initialX + dx), window.innerWidth - 170);
      const newY = Math.min(Math.max(50, dragStartRef.current.initialY + dy), window.innerHeight - 80);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setPosition((curr) => {
        savePosition(curr.x, curr.y);
        return curr;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.moved = true;
    }
    const newX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 160);
    const newY = Math.min(Math.max(50, dragStartRef.current.initialY + dy), window.innerHeight - 80);
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setPosition((curr) => {
      savePosition(curr.x, curr.y);
      return curr;
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    // If was dragging, don't trigger click action
    if (dragStartRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onOpenAi();
  };

  return (
    <div
      ref={bubbleRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-50 select-none transition-shadow ${
        isDragging ? 'cursor-grabbing opacity-90 scale-105' : 'cursor-grab hover:scale-105'
      }`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      title="Dra för att flytta bubblan • Klicka för att öppna AI Bygghjälp"
    >
      <div
        onClick={handleClick}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 sm:py-2 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white rounded-full shadow-2xl shadow-sky-950/80 border-2 border-sky-300/80 active:scale-95 transition-transform backdrop-blur-md group"
      >
        {/* Robot/Sparkles badge icon */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/40 border border-sky-200/50 flex items-center justify-center shrink-0 shadow-inner relative">
          <Bot className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-sky-600" />
        </div>

        {/* Text and drag hint */}
        <div className="flex flex-col text-left leading-tight">
          <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-sm flex items-center gap-1">
            <span>AI Bygghjälp</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </span>
          <span className="text-[10px] text-sky-100 font-medium opacity-90 truncate max-w-[100px] sm:max-w-[120px]">
            {activeMomentTitle || 'Flytta fritt • Klicka'}
          </span>
        </div>

        {/* Small drag grip icon */}
        <div className="pl-0.5 text-sky-200/60 group-hover:text-white transition-colors">
          <Move className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
