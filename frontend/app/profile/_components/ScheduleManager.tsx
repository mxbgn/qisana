'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';

interface TimeOption {
  h: string;
  m: string;
  full: string;
  display?: string;
}

export default function ScheduleManager({ shifts = [], setShifts }: { shifts: any[], setShifts: any }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newShift, setNewShift] = useState({ startH: '', startM: '', endH: '', endM: '' });
  const [isShiftError, setIsShiftError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startContainerRef = useRef<HTMLDivElement>(null);
  const endContainerRef = useRef<HTMLDivElement>(null);
  const refs = {
    startH: useRef<HTMLInputElement>(null), startM: useRef<HTMLInputElement>(null),
    endH: useRef<HTMLInputElement>(null), endM: useRef<HTMLInputElement>(null),
    submit: useRef<HTMLButtonElement>(null)
  };

  const times: TimeOption[] = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2).toString().padStart(2, '0');
    const m = (i % 2 === 0 ? '00' : '30');
    return { h, m, full: `${h}:${m}` };
  });

  const endTimes: TimeOption[] = [
    ...times.filter(t => t.full !== '00:00'),
    { h: '23', m: '59', full: '23:59', display: '24:00' }
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (startContainerRef.current && !startContainerRef.current.contains(target)) setShowStartPicker(false);
      if (endContainerRef.current && !endContainerRef.current.contains(target)) setShowEndPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerShiftError = (msg: string) => {
    setErrorMessage(msg);
    setIsShiftError(true);
    setTimeout(() => {
      setIsShiftError(false);
      setErrorMessage(null);
    }, 3000);
  };

  const isShiftInPast = (dateStr: string, h: string, m: string) => {
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const shiftDate = new Date(year, month - 1, day, parseInt(h), parseInt(m));
    return shiftDate < now;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof newShift, nextRef?: React.RefObject<HTMLElement | null>) => {
    let val = e.target.value.replace(/\D/g, '');
    const isDel = (e.nativeEvent as any).inputType === 'deleteContentBackward';
    if (val.length === 2) {
      const num = parseInt(val);
      if (key.includes('H') && num > 23) val = '23';
      if (key.includes('M') && num > 59) val = '59';
    }
    setNewShift(prev => ({ ...prev, [key]: val }));
    if (val.length === 2 && !isDel && nextRef?.current) {
      if (key === 'startM') {
        setShowStartPicker(false);
        setShowEndPicker(true);
      }
      nextRef.current.focus();
    }
  };

  const currentDayShifts = selectedDate ? shifts.filter(s => s.date === selectedDate) : [];

  const addShift = async () => {
    if (isSubmitting) return;
    if (!selectedDate || !newShift.startH || !newShift.startM || !newShift.endH || !newShift.endM) {
      return triggerShiftError("Veuillez remplir tous les champs.");
    }
    if (isShiftInPast(selectedDate, newShift.startH, newShift.startM)) {
      return triggerShiftError("Impossible de réserver un créneau dans le passé.");
    }
    
    const startH = newShift.startH.padStart(2, '0');
    const startM = newShift.startM.padStart(2, '0');
    const endH = newShift.endH.padStart(2, '0');
    const endM = newShift.endM.padStart(2, '0');

    const startMins = parseInt(startH) * 60 + parseInt(startM);
    const endMins = parseInt(endH) * 60 + parseInt(endM);

    if (startMins >= endMins) return triggerShiftError("L'heure de fin doit être après l'heure de début.");
    
    const hasOverlap = currentDayShifts.some(shift => {
      const [esH, esM] = shift.start.split(':').map(Number);
      const [eeH, eeM] = shift.end.split(':').map(Number);
      const existingStartMins = esH * 60 + esM;
      const existingEndMins = eeH * 60 + eeM;
      return startMins < existingEndMins && endMins > existingStartMins;
    });
    
    if (hasOverlap) return triggerShiftError("Ce créneau chevauche un créneau existant.");
    
    setIsSubmitting(true);
    const updatedShifts = [...shifts, { date: selectedDate, start: `${startH}:${startM}`, end: `${endH}:${endM}` }];
    try {
      await api.post('/users/availability', { shifts: updatedShifts });
      const res = await api.get('/users/availability/me');
      setShifts(res.data || []);
      setNewShift({ startH: '', startM: '', endH: '', endM: '' });
      setShowStartPicker(false);
      setShowEndPicker(false);
    } catch (err) { 
      triggerShiftError("Erreur lors de l'enregistrement."); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteShift = async (shiftToDelete: any) => {
    const previousShifts = [...shifts];
    const now = new Date();
    const [year, month, day] = shiftToDelete.date.split('-').map(Number);
    const [startH, startM] = shiftToDelete.start.split(':').map(Number);
    const [endH, endM] = shiftToDelete.end.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, startH, startM);
    const endDate = new Date(year, month - 1, day, endH, endM);
    
    let updatedShifts;
    if (now > startDate && now < endDate) {
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      updatedShifts = shifts.map(s => 
        (s.date === shiftToDelete.date && s.start === shiftToDelete.start) 
          ? { ...s, end: `${currentH}:${currentM}` } 
          : s
      );
    } else {
      updatedShifts = shifts.filter(s => !(s.date === shiftToDelete.date && s.start === shiftToDelete.start));
    }
    
    setShifts(updatedShifts);
    try {
      await api.post('/users/availability', { shifts: updatedShifts });
      const res = await api.get('/users/availability/me');
      setShifts(res.data || []);
    } catch (err) {
      setShifts(previousShifts);
    }
  };

  const renderCalendar = (monthOffset: number) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const monthName = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    
    const firstDay = date.getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    return (
      <div className="space-y-4">
        <p className="label-title text-center capitalize">{monthName}</p>
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
          {['L','M','M','J','V','S','D'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startOffset }).map((_, b) => (
            <div key={`blank-${monthOffset}-${b}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasShift = shifts.some(s => s.date === dateStr);
            const isSelected = selectedDate === dateStr;
            return (
              <button 
                key={day} 
                onClick={() => { setSelectedDate(isSelected ? null : dateStr); setNewShift({ startH: '', startM: '', endH: '', endM: '' }); setIsShiftError(false); }}
                className={`h-11 w-full rounded-xl text-sm font-bold transition-all ${
                  isSelected 
                    ? 'bg-brand-ice/40 border border-brand-ice text-brand-navy shadow-sm transform scale-105 z-10' 
                    : hasShift 
                      ? 'bg-brand-navy text-white hover:bg-brand-navy/90' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="qisana-card p-8">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">Calendrier</h2>
          <div className="flex gap-4 text-micro label-title">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-brand-navy rounded"></span> Service</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-100 rounded"></span> Libre</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">{renderCalendar(0)}{renderCalendar(1)}</div>
      </div>

      {selectedDate && (
        <div className="qisana-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-visible animate-in fade-in slide-in-from-top-2">
          <div className="flex-1 min-w-0 flex flex-col items-start gap-3 w-full">
            <div className="h-7 flex items-center">
              <p className="text-lg font-bold text-brand-navy tracking-tight whitespace-nowrap">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full items-center min-h-[28px]">
              {currentDayShifts.length > 0 ? currentDayShifts.map((shift, idx) => {
                const isPast = isShiftInPast(shift.date, shift.end.split(':')[0], shift.end.split(':')[1]);
                const displayEnd = shift.end === '23:59' ? '24:00' : shift.end;
                return (
                  <div key={idx} className={`group qisana-pill bg-brand-ice/30 border-brand-ice/60 flex items-center shadow-sm shrink-0 h-7 ${!isPast ? 'gap-2 pr-1' : 'px-3'}`}>
                    <span className={`text-sm font-bold leading-none ${isPast ? 'text-slate-400' : 'text-brand-navy'}`}>
                      {shift.start} — {displayEnd}
                    </span>
                    {!isPast && (
                      <button onClick={() => deleteShift(shift)} className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              }) : <span className="text-sm text-slate-400 italic font-medium leading-7">Aucun créneau réservé</span>}
            </div>
          </div>

          <div className="hidden md:flex items-center self-stretch py-2">
            <div className="w-px h-16 bg-slate-100"></div>
          </div>
          <div className="md:hidden w-full h-px bg-slate-100 my-2"></div>
          
          <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto relative">
            {errorMessage && (
              <div className="absolute bottom-full left-0 mb-2 w-full text-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter bg-rose-50 px-2 py-1 rounded border border-rose-100 block max-w-full break-words whitespace-normal">{errorMessage}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <div ref={startContainerRef} className="relative">
                <div 
                  onClick={() => {
                    setShowStartPicker(true);
                    setShowEndPicker(false);
                    if (newShift.startH.length < 2) {
                      refs.startH.current?.focus();
                    } else {
                      refs.startM.current?.focus();
                    }
                  }} 
                  className={`flex items-center qisana-input px-3 h-11 transition-all cursor-pointer ${isShiftError && (!newShift.startH || !newShift.startM) ? 'border-rose-400 bg-rose-50/20' : ''}`}
                >
                  <input ref={refs.startH} type="text" maxLength={2} placeholder="HH" value={newShift.startH} onFocus={() => { setShowStartPicker(true); setShowEndPicker(false); }} onChange={e => handleInput(e, 'startH', refs.startM)} className="w-8 bg-transparent text-center outline-none placeholder:text-slate-300 font-bold text-slate-700 text-sm cursor-pointer" />
                  <span className="text-slate-300 font-bold mx-0.5">:</span>
                  <input ref={refs.startM} type="text" maxLength={2} placeholder="MM" value={newShift.startM} onFocus={() => { setShowStartPicker(true); setShowEndPicker(false); }} onChange={e => handleInput(e, 'startM', refs.endH)} className="w-8 bg-transparent text-center outline-none placeholder:text-slate-300 font-bold text-slate-700 text-sm cursor-pointer" />
                </div>
                {showStartPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-full min-w-[110px] qisana-card shadow-xl z-[1200] bg-white border border-brand-ice/60">
                    <div className="h-48 overflow-y-auto scrollbar-hide mask-fade-edges py-2">
                      {times.map(t => (
                        <div key={t.full} onMouseDown={(e) => { e.preventDefault(); setNewShift({...newShift, startH: t.h, startM: t.m}); setShowStartPicker(false); setShowEndPicker(true); setTimeout(() => refs.endH.current?.focus(), 10); }} className="px-3 py-2 text-center text-sm font-bold text-slate-600 hover:bg-brand-ice/20 hover:text-brand-navy cursor-pointer transition-colors">{t.full}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">à</span>
              <div ref={endContainerRef} className="relative">
                <div 
                  onClick={() => {
                    setShowEndPicker(true);
                    setShowStartPicker(false);
                    if (newShift.endH.length < 2) {
                      refs.endH.current?.focus();
                    } else {
                      refs.endM.current?.focus();
                    }
                  }} 
                  className={`flex items-center qisana-input px-3 h-11 transition-all cursor-pointer ${isShiftError && (!newShift.endH || !newShift.endM) ? 'border-rose-400 bg-rose-50/20' : ''}`}
                >
                  <input 
                    ref={refs.endH} 
                    type="text" 
                    maxLength={2} 
                    placeholder="HH" 
                    value={newShift.endH === '23' && newShift.endM === '59' ? '24' : newShift.endH}
                    onFocus={() => { setShowEndPicker(true); setShowStartPicker(false); }} 
                    onChange={e => handleInput(e, 'endH', refs.endM)} 
                    className="w-8 bg-transparent text-center outline-none placeholder:text-slate-300 font-bold text-slate-700 text-sm cursor-pointer" 
                  />
                  <span className="text-slate-300 font-bold mx-0.5">:</span>
                  <input 
                    ref={refs.endM} 
                    type="text" 
                    maxLength={2} 
                    placeholder="MM" 
                    value={newShift.endH === '23' && newShift.endM === '59' ? '00' : newShift.endM}
                    onFocus={() => { setShowEndPicker(true); setShowStartPicker(false); }} 
                    onChange={e => handleInput(e, 'endM', refs.submit)} 
                    className="w-8 bg-transparent text-center outline-none placeholder:text-slate-300 font-bold text-slate-700 text-sm cursor-pointer" 
                  />
                </div>
                {showEndPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-full min-w-[110px] qisana-card shadow-xl z-[1200] bg-white border border-brand-ice/60">
                    <div className="h-48 overflow-y-auto scrollbar-hide mask-fade-edges py-2">
                      {endTimes.map(t => (
                        <div key={t.full} onMouseDown={(e) => { e.preventDefault(); setNewShift({...newShift, endH: t.h, endM: t.m}); setShowEndPicker(false); refs.submit.current?.focus(); }} className="px-3 py-2 text-center text-sm font-bold text-slate-600 hover:bg-brand-ice/20 hover:text-brand-navy cursor-pointer transition-colors">
                          {t.display || t.full}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={addShift} ref={refs.submit} disabled={isSubmitting} className={`qisana-btn w-full shadow-sm transition-all duration-300 ${isShiftError ? 'animate-shake qisana-btn-error' : ''} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>Ajouter</button>
          </div>
        </div>
      )}
    </>
  );
}
