import { useState, useEffect, useRef } from 'react';

export interface SearchFilters {
  specialty: 'DOCTOR' | 'NURSE' | null;
  hasFormationDeces: boolean;
  hasTeleconsultation: boolean;
  hasPrado: boolean;
  hasPdsa: boolean;
}

export interface SearchBarInitialValues {
  address: string;
  coords: { lat: number; lng: number };
  dateStr: string;
  filters: SearchFilters;
  hasTeleconsultation: boolean;
  hasPrado: boolean;
  hasPdsa: boolean;
}

interface SearchBarProps {
  onSearch: (coords: { lat: number; lng: number }, dateStr: string, address: string, filters: SearchFilters) => void;
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  loading: boolean;
  initialValues?: SearchBarInitialValues | null;
}

interface DateTimeState {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}

function parseDateStr(dateStr: string): DateTimeState | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return { day, month, year, hour, minute };
}

export default function SearchBar({ onSearch, onLocationSelect, loading, initialValues }: SearchBarProps) {
  const [query, setQuery] = useState(initialValues?.address ?? '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(
    initialValues ? { lat: initialValues.coords.lat, lng: initialValues.coords.lng } : null
  );
  const userEditedRef = useRef(false);
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  
  const [dt, setDt] = useState<DateTimeState>(
    (initialValues?.dateStr ? parseDateStr(initialValues.dateStr) : null) ?? { day: '', month: '', year: '', hour: '', minute: '' }
  );
  const [isError, setIsError] = useState(false);

  const [specialty, setSpecialty] = useState<'DOCTOR' | 'NURSE' | null>(initialValues?.filters?.specialty ?? null);
  const [hasFormationDeces, setHasFormationDeces] = useState(initialValues?.filters?.hasFormationDeces ?? false);
  const [hasTeleconsultation, setHasTeleconsultation] = useState(initialValues?.filters?.hasTeleconsultation ?? false);
  const [hasPrado, setHasPrado] = useState(initialValues?.filters?.hasPrado ?? false);
  const [hasPdsa, setHasPdsa] = useState(initialValues?.filters?.hasPdsa ?? false);

  const [calendarFocusDate, setCalendarFocusDate] = useState<Date | null>(null);
  const [activeTimeIndex, setActiveTimeIndex] = useState(-1);
  const [activeFilterIndex, setActiveFilterIndex] = useState(-1);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filtersMenuRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);

  const refs = {
    day: useRef<HTMLInputElement>(null), month: useRef<HTMLInputElement>(null),
    year: useRef<HTMLInputElement>(null), hour: useRef<HTMLInputElement>(null),
    minute: useRef<HTMLInputElement>(null), submit: useRef<HTMLButtonElement>(null),
    datePill: useRef<HTMLDivElement>(null), timePill: useRef<HTMLDivElement>(null),
    filterBtn: useRef<HTMLButtonElement>(null)
  };

  const times = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = (i % 2 === 0 ? '00' : '30');
    return { h, m, full: `${h}:${m}` };
  });

  useEffect(() => {
    if (showCalendar) {
      const y = (typeof dt === 'object' && dt?.year) ? parseInt(dt.year) || new Date().getFullYear() : new Date().getFullYear();
      const m = (typeof dt === 'object' && dt?.month) ? (parseInt(dt.month) || new Date().getMonth() + 1) - 1 : new Date().getMonth();
      const d = (typeof dt === 'object' && dt?.day) ? parseInt(dt.day) || new Date().getDate() : new Date().getDate();
      const target = new Date(y, m, d);
      setCalendarFocusDate(isNaN(target.getTime()) ? new Date() : target);
    }
  }, [showCalendar]);

  useEffect(() => {
    if (showTimePicker) {
      const currentFull = `${dt.hour.padStart(2, '0')}:${dt.minute.padStart(2, '0')}`;
      const idx = times.findIndex(t => t.full === currentFull);
      setActiveTimeIndex(idx >= 0 ? idx : 0);
    } else {
      setActiveTimeIndex(-1);
    }
  }, [showTimePicker]);

  useEffect(() => {
    if (!showFiltersMenu) setActiveFilterIndex(-1);
  }, [showFiltersMenu]);

  useEffect(() => {
    if (activeTimeIndex >= 0 && timeScrollRef.current) {
      const activeEl = timeScrollRef.current.children[activeTimeIndex] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeTimeIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) setSuggestions([]);
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(target)) setShowFiltersMenu(false);
      if (refs.datePill.current && !refs.datePill.current.contains(target)) setShowCalendar(false);
      if (refs.timePill.current && !refs.timePill.current.contains(target)) setShowTimePicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userEditedRef.current || query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.features || []);
        setActiveIndex(-1);
      } catch (err) {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (s: any) => {
    const [lng, lat] = s.geometry.coordinates;
    userEditedRef.current = false;
    setSelectedCoords({ lat, lng });
    setQuery(s.properties.label);
    setSuggestions([]);
    setActiveIndex(-1);
    onLocationSelect({ lat, lng });
    setIsError(false);
    setTimeout(() => refs.day.current?.focus(), 50);
  };

  const handleSelectDate = (date: Date) => {
    setDt(p => ({
      ...p,
      day: date.getDate().toString().padStart(2, '0'),
      month: (date.getMonth() + 1).toString().padStart(2, '0'),
      year: date.getFullYear().toString()
    }));
    setShowCalendar(false);
    setTimeout(() => refs.hour.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(p => (p < suggestions.length - 1 ? p + 1 : p)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(p => (p > 0 ? p - 1 : 0)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(suggestions[activeIndex]); }
  };

  const handleDatePillKeyDown = (e: React.KeyboardEvent) => {
    if (!showCalendar || !calendarFocusDate) return;
    const nextDate = new Date(calendarFocusDate);
    if (e.key === 'ArrowLeft') { e.preventDefault(); nextDate.setDate(nextDate.getDate() - 1); setCalendarFocusDate(nextDate); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextDate.setDate(nextDate.getDate() + 1); setCalendarFocusDate(nextDate); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nextDate.setDate(nextDate.getDate() - 7); setCalendarFocusDate(nextDate); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); nextDate.setDate(nextDate.getDate() + 7); setCalendarFocusDate(nextDate); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowCalendar(false); }
    else if (e.key === 'Enter') { e.preventDefault(); handleSelectDate(calendarFocusDate); }
  };

  const handleTimePillKeyDown = (e: React.KeyboardEvent) => {
    if (!showTimePicker) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveTimeIndex(p => (p < times.length - 1 ? p + 1 : p)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveTimeIndex(p => (p > 0 ? p - 1 : 0)); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowTimePicker(false); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeTimeIndex >= 0 && activeTimeIndex < times.length) {
        const t = times[activeTimeIndex];
        setDt(prev => ({ ...prev, hour: t.h, minute: t.m }));
        setShowTimePicker(false);
        refs.submit.current?.focus();
      }
    }
  };

  const handleFiltersKeyDown = (e: React.KeyboardEvent) => {
    if (!showFiltersMenu) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setActiveFilterIndex(p => (p < 1 ? p + 1 : p)); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setActiveFilterIndex(p => (p > 0 ? p - 1 : 0)); }
    else if (e.key === 'Escape') { e.preventDefault(); setShowFiltersMenu(false); refs.filterBtn.current?.focus(); }
    else if (e.key === 'Enter' && activeFilterIndex >= 0) {
      e.preventDefault();
      if (activeFilterIndex === 0) setSpecialty(p => p === 'DOCTOR' ? null : 'DOCTOR');
      if (activeFilterIndex === 1) setHasFormationDeces(p => !p);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: keyof DateTimeState, max: number, nextRef?: React.RefObject<HTMLElement | null>) => {
    let val = e.target.value.replace(/\D/g, '');
    const isDel = (e.nativeEvent as any).inputType === 'deleteContentBackward';
    setDt(prev => {
      const nextDt = { ...prev, [key]: val };
      if (val.length === max) {
        const num = parseInt(val);
        if (key === 'month' && num > 12) nextDt.month = '12';
        if (key === 'hour' && num > 23) nextDt.hour = '23';
        if (key === 'minute' && num > 59) nextDt.minute = '59';
      }
      const y = nextDt.year.length === 4 ? parseInt(nextDt.year) : new Date().getFullYear();
      const m = nextDt.month.length === 2 && parseInt(nextDt.month) >= 1 && parseInt(nextDt.month) <= 12 ? parseInt(nextDt.month) : 1;
      const maxDays = new Date(y, m, 0).getDate();
      if (nextDt.day.length === 2) {
        const d = parseInt(nextDt.day);
        if (d > maxDays) nextDt.day = maxDays.toString();
        if (d === 0) nextDt.day = '01';
      }
      return nextDt;
    });
    setIsError(false);
    if (val.length === max && !isDel && nextRef?.current) nextRef.current.focus();
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoords || !dt.day || !dt.month || !dt.year || !dt.hour || !dt.minute) return setIsError(true);
    const pad = (v: string) => v.padStart(2, '0');
    const dateStr = `${dt.year}-${pad(dt.month)}-${pad(dt.day)}T${pad(dt.hour)}:${pad(dt.minute)}:00Z`;
    onSearch(selectedCoords, dateStr, query, { specialty, hasFormationDeces, hasTeleconsultation, hasPrado, hasPdsa });
  };

  const renderCustomCalendar = () => {
    const now = new Date();
    return (
      <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-[560px] max-w-[calc(100vw-2rem)] qisana-card shadow-xl z-[1100] p-6 bg-white grid grid-cols-1 sm:grid-cols-2 gap-8 border border-brand-ice/60">
        {[0, 1].map(offset => {
          const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
          const y = date.getFullYear();
          const m = date.getMonth() + 1;
          const daysInMonth = new Date(y, m, 0).getDate();
          const firstDay = new Date(y, m - 1, 1).getDay();
          const startOffset = firstDay === 0 ? 6 : firstDay - 1;
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
          const blanks = Array.from({ length: startOffset }, (_, i) => i);
          return (
            <div key={offset}>
              <div className="text-center font-bold text-brand-navy tracking-tight mb-4 text-sm capitalize">{date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 text-surface-muted font-bold uppercase tracking-widest">{['L','M','M','J','V','S','D'].map((d, i) => <div key={i}>{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {blanks.map(b => <div key={`blank-${offset}-${b}`} />)}
                {days.map(d => {
                  const isSelected = parseInt(dt.day) === d && parseInt(dt.month) === m && parseInt(dt.year) === y;
                  const isFocused = calendarFocusDate && calendarFocusDate.getDate() === d && (calendarFocusDate.getMonth() + 1) === m && calendarFocusDate.getFullYear() === y;
                  return (
                    <div key={d} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleSelectDate(new Date(y, m - 1, d)); }} onMouseEnter={() => setCalendarFocusDate(new Date(y, m - 1, d))} className={`cursor-pointer rounded-lg py-1.5 font-bold transition-all ${isSelected ? 'bg-brand-navy text-white shadow-sm' : isFocused ? 'bg-brand-ice/40 text-brand-navy' : 'text-slate-700'}`}>{d}</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const activeFiltersCount = (specialty ? 1 : 0) + (hasFormationDeces ? 1 : 0) + (hasTeleconsultation ? 1 : 0) + (hasPrado ? 1 : 0) + (hasPdsa ? 1 : 0);

  return (
    <header className="qisana-card p-3 flex flex-col relative z-40 w-full !overflow-visible font-sans">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 w-full relative items-stretch md:items-center">
        <div ref={searchContainerRef} className="w-full md:flex-1 relative">
          <input 
            type="text" 
            value={query} 
            placeholder="Localisation de l'intervention..." 
            className={`w-full qisana-input outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:border-brand-ice text-center md:text-left font-bold text-slate-700 placeholder:font-bold placeholder:text-slate-300 ${isError && !selectedCoords ? 'qisana-input-error' : ''}`} 
            onChange={(e) => { userEditedRef.current = true; setQuery(e.target.value); setSelectedCoords(null); setIsError(false); }} 
            onKeyDown={handleKeyDown} 
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-[110%] left-0 w-full z-[1000] qisana-card shadow-xl overflow-hidden border border-brand-ice/60">
              {suggestions.map((s, i) => (
                <li 
                  key={s.properties.id || i} 
                  className={`px-4 py-3 text-sm cursor-pointer border-b border-brand-ice/30 last:border-0 transition-all ${activeIndex === i ? 'bg-brand-ice/30 text-brand-navy z-10 relative' : 'bg-white'}`} 
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }} 
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <div className={`font-bold text-sm ${activeIndex === i ? 'text-brand-navy' : 'text-slate-700'}`}>
                    {s.properties.name}
                  </div>
                  <div className={`text-micro uppercase font-bold tracking-widest mt-0.5 ${activeIndex === i ? 'text-brand-navy/70' : 'text-surface-muted'}`}>
                    {s.properties.postcode} {s.properties.city}
                  </div>
                </li>
              ))}
            </ul>
          )} 
        </div>

        <div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto">
          <div 
            ref={refs.datePill} 
            onKeyDown={handleDatePillKeyDown} 
            onFocus={() => { if(!showCalendar) { setShowCalendar(true); setShowTimePicker(false); setShowFiltersMenu(false); } }} 
            onClick={() => { setShowCalendar(true); setShowTimePicker(false); setShowFiltersMenu(false); }} 
            className={`flex items-center justify-center qisana-input !px-4 cursor-pointer relative w-full md:w-auto ${isError && (!dt.day || !dt.month || !dt.year) ? 'qisana-input-error' : ''}`}
          >
            <input ref={refs.day} type="text" maxLength={2} placeholder="JJ" value={dt.day} onChange={e => handleInput(e, 'day', 2, refs.month)} className="w-8 bg-transparent text-center text-sm outline-none font-bold text-slate-700 placeholder:font-bold placeholder:text-slate-300" />
            <span className="text-slate-300 font-bold mx-0.5">/</span>
            <input ref={refs.month} type="text" maxLength={2} placeholder="MM" value={dt.month} onChange={e => handleInput(e, 'month', 2, refs.year)} className="w-8 bg-transparent text-center text-sm outline-none font-bold text-slate-700 placeholder:font-bold placeholder:text-slate-300" />
            <span className="text-slate-300 font-bold mx-0.5">/</span>
            <input ref={refs.year} type="text" maxLength={4} placeholder="AAAA" value={dt.year} onChange={e => handleInput(e, 'year', 4, refs.hour)} className="w-12 bg-transparent text-center text-sm outline-none font-bold text-slate-700 placeholder:font-bold placeholder:text-slate-300" />
            {showCalendar && renderCustomCalendar()}
          </div>

          <div 
            ref={refs.timePill} 
            onKeyDown={handleTimePillKeyDown} 
            onFocus={() => { if(!showTimePicker) { setShowTimePicker(true); setShowCalendar(false); setShowFiltersMenu(false); } }} 
            onClick={() => { setShowTimePicker(true); setShowCalendar(false); setShowFiltersMenu(false); }} 
            className={`flex items-center justify-center qisana-input !px-4 cursor-pointer relative w-full md:w-auto ${isError && (!dt.hour || !dt.minute) ? 'qisana-input-error' : ''}`}
          >
            <input ref={refs.hour} type="text" maxLength={2} placeholder="HH" value={dt.hour} onChange={e => handleInput(e, 'hour', 2, refs.minute)} className="w-8 bg-transparent text-center text-sm outline-none font-bold text-slate-700 placeholder:font-bold placeholder:text-slate-300" />
            <span className="text-slate-300 font-bold mx-0.5">:</span>
            <input ref={refs.minute} type="text" maxLength={2} placeholder="MM" value={dt.minute} onChange={e => handleInput(e, 'minute', 2, refs.submit)} className="w-8 bg-transparent text-center text-sm outline-none font-bold text-slate-700 placeholder:font-bold placeholder:text-slate-300" />
            {showTimePicker && (
              <div className="absolute top-[110%] left-0 w-full qisana-card shadow-xl z-[1100] overflow-hidden border border-brand-ice/60">
                <div ref={timeScrollRef} tabIndex={-1} className="h-48 overflow-y-auto scrollbar-hide mask-fade-edges py-2 outline-none bg-white">
                  {times.map((t, i) => (
                    <div key={t.full} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDt(prev => ({ ...prev, hour: t.h, minute: t.m })); setShowTimePicker(false); refs.submit.current?.focus(); }} onMouseEnter={() => setActiveTimeIndex(i)} className={`px-4 py-2 text-center text-sm font-bold cursor-pointer transition-all ${activeTimeIndex === i ? 'bg-brand-ice/30 text-brand-navy z-10 relative' : 'text-slate-600'}`}>{t.full}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full md:flex md:w-auto md:flex-none">
          <div ref={filtersMenuRef} onKeyDown={handleFiltersKeyDown} className="relative md:flex-none">
            <button 
              ref={refs.filterBtn} 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setShowFiltersMenu(!showFiltersMenu); setShowCalendar(false); setShowTimePicker(false); }} 
              className={`qisana-input outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus:ring-offset-0 !px-4 flex items-center justify-center gap-2.5 font-bold text-sm cursor-pointer select-none transition-colors w-full md:w-auto ${showFiltersMenu || activeFiltersCount > 0 ? 'border-brand-ice text-brand-navy bg-brand-ice/30' : 'text-slate-700 hover:text-brand-navy'}`}
            >
              <div className="relative inline-flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                {activeFiltersCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-navy text-white text-[10px] !font-bold scale-85 rounded-full flex items-center justify-center leading-none shadow-sm select-none">{activeFiltersCount}</span>}
              </div>
              <span>Filtres</span>
            </button>
            {showFiltersMenu && (
              <div className="absolute top-[120%] right-0 max-w-[calc(100vw-2rem)] qisana-card shadow-xl z-[1100] p-2 bg-white border border-brand-ice/60 flex flex-row items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button type="button" tabIndex={-1} onMouseEnter={() => setActiveFilterIndex(0)} onClick={() => setSpecialty(prev => prev === 'DOCTOR' ? null : 'DOCTOR')} className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full border border-brand-ice transition-all whitespace-nowrap ${specialty === 'DOCTOR' ? 'bg-brand-navy text-white border-transparent shadow-sm' : activeFilterIndex === 0 ? 'bg-brand-ice/40 text-brand-navy' : 'bg-white text-surface-muted hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'}`}>Docteur</button>
                <button type="button" tabIndex={-1} onMouseEnter={() => setActiveFilterIndex(1)} onClick={() => setHasFormationDeces(!hasFormationDeces)} className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full border border-brand-ice transition-all whitespace-nowrap ${hasFormationDeces ? 'bg-brand-navy text-white border-transparent shadow-sm' : activeFilterIndex === 1 ? 'bg-brand-ice/40 text-brand-navy' : 'bg-white text-surface-muted hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'}`}>Certificat décès</button>
                <button type="button" tabIndex={-1} onClick={() => setHasTeleconsultation(!hasTeleconsultation)} className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full border border-brand-ice transition-all whitespace-nowrap ${hasTeleconsultation ? 'bg-brand-navy text-white border-transparent shadow-sm' : 'bg-white text-surface-muted hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'}`}>Téléconsultation</button>
                <button type="button" tabIndex={-1} onClick={() => setHasPrado(!hasPrado)} className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full border border-brand-ice transition-all whitespace-nowrap ${hasPrado ? 'bg-brand-navy text-white border-transparent shadow-sm' : 'bg-white text-surface-muted hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'}`}>PRADO</button>
                <button type="button" tabIndex={-1} onClick={() => setHasPdsa(!hasPdsa)} className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full border border-brand-ice transition-all whitespace-nowrap ${hasPdsa ? 'bg-brand-navy text-white border-transparent shadow-sm' : 'bg-white text-surface-muted hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'}`}>PDSA</button>
              </div>
            )}
          </div>

          <button ref={refs.submit} className="qisana-btn outline-none w-full md:w-auto">{loading ? 'Recherche...' : 'Rechercher'}</button>
        </div>
      </form>
    </header>
  );
}
