import React, { useState, useRef, useEffect } from 'react';

export interface SearchTabSnapshot {
  searchId: string;
  title: string;
  address: string;
  searchDate: string;
  coords: { lat: number; lng: number; zoom?: number };
  filters: any;
  results: any[];
  selectedProId: number | null;
  confirmedProId: number | null;
}

interface TabBarProps {
  tabs: SearchTabSnapshot[];
  activeTabId: string | null;
  onTabSelect: (tab: SearchTabSnapshot) => void;
  onTabClose: (e: React.MouseEvent, tabId: string) => void;
}

function ScrollingTabTitle({ text, isHovered }: { text: string; isHovered: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHovered) {
      setTranslateX(0);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const overflow = textEl.scrollWidth - container.clientWidth;
    if (overflow <= 0) return;

    let startTime: number | null = null;

    const INITIAL_PAUSE = 200;
    const MOVE_DURATION = Math.max(1200, overflow * 25);
    const END_PAUSE = 600;
    const TOTAL_CYCLE = INITIAL_PAUSE + MOVE_DURATION + END_PAUSE + MOVE_DURATION;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % TOTAL_CYCLE;

      if (elapsed < INITIAL_PAUSE) {
        setTranslateX(0);
      } else if (elapsed < INITIAL_PAUSE + MOVE_DURATION) {
        const t = (elapsed - INITIAL_PAUSE) / MOVE_DURATION;
        const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
        setTranslateX(-eased * overflow);
      } else if (elapsed < INITIAL_PAUSE + MOVE_DURATION + END_PAUSE) {
        setTranslateX(-overflow);
      } else {
        const t = (elapsed - INITIAL_PAUSE - MOVE_DURATION - END_PAUSE) / MOVE_DURATION;
        const eased = 0.5 - 0.5 * Math.cos(t * Math.PI);
        setTranslateX(-(1 - eased) * overflow);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isHovered, text]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden max-w-[140px] whitespace-nowrap"
    >
      <span
        ref={textRef}
        className="inline-block"
        style={{
          transform: `translateX(${translateX}px)`,
          willChange: 'transform',
        }}
      >
        {text}
      </span>
    </div>
  );
}

function TabItem({
  tab,
  isActive,
  onTabSelect,
  onTabClose,
}: {
  tab: SearchTabSnapshot;
  isActive: boolean;
  onTabSelect: (tab: SearchTabSnapshot) => void;
  onTabClose: (e: React.MouseEvent, tabId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const displayText = tab.address || tab.title;

  return (
    <div
      onClick={() => onTabSelect(tab)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onTouchCancel={() => setIsHovered(false)}
      className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 border select-none ${
        isActive
          ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
          : 'bg-white text-surface-muted border-brand-ice hover:border-brand-ice hover:bg-brand-ice/30 hover:text-brand-navy shadow-sm hover:shadow-md'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-success-main shrink-0" />

      <ScrollingTabTitle text={displayText} isHovered={isHovered} />

      <button
        type="button"
        onClick={(e) => onTabClose(e, tab.searchId)}
        className={`ml-1 rounded-md p-0.5 transition-colors shrink-0 ${
          isActive
            ? 'text-brand-ice hover:bg-white/20 hover:text-white'
            : 'text-surface-muted hover:bg-brand-ice/50 hover:text-brand-navy'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}

export default function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
      {tabs.map((tab) => (
        <TabItem
          key={tab.searchId}
          tab={tab}
          isActive={tab.searchId === activeTabId}
          onTabSelect={onTabSelect}
          onTabClose={onTabClose}
        />
      ))}
    </div>
  );
}
