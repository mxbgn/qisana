import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export default function ProfileForm({ profile, setProfile }: { profile: any, setProfile: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [occitanieData, setOccitanieData] = useState<Record<string, any[]>>({});
  
  const ignoreFetch = useRef(true);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const setRef = (key: string) => (el: HTMLElement | null) => { 
    fieldRefs.current[key] = el; 
  };

  const clearError = (key: string) => {
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
    if (generalError) setGeneralError(null);
  };

  const scrollToError = (key: string) => {
    if (fieldRefs.current[key]) {
      setTimeout(() => {
        fieldRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldRefs.current[key]?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    const fetchCpts = async () => {
      try {
        const { data } = await api.get('/cpts/grouped');
        if (data && data['Occitanie']) {
          setOccitanieData(data['Occitanie']);
        }
      } catch (err) {
        console.error("Erreur de chargement des CPTS", err);
      }
    };
    fetchCpts();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    
    const newErrors: Record<string, boolean> = {};
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    
    if (!profile.gender) newErrors.gender = true;
    if (!profile.firstName || profile.firstName.length > 50 || !nameRegex.test(profile.firstName)) newErrors.firstName = true;
    if (!profile.lastName || profile.lastName.length > 50 || !nameRegex.test(profile.lastName)) newErrors.lastName = true;
    if (!profile.phone || profile.phone.length !== 10) newErrors.phone = true;
    if (!profile.adeli || profile.adeli.length !== 9) newErrors.adeli = true;
    if (!profile.rpps || profile.rpps.length !== 11) newErrors.rpps = true;
    if (!profile.specialty) newErrors.specialty = true;
    if (!profile.hasFormationDeces && !profile.hasTeleconsultation && !profile.hasPrado && !profile.hasPdsa) {
      newErrors.qualifications = true;
    }
    if (!profile.address) newErrors.address = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = ['gender', 'firstName', 'lastName', 'phone', 'adeli', 'rpps', 'specialty', 'qualifications', 'address'].find(k => newErrors[k]);
      if (firstError) scrollToError(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedCptsId = (profile.cptsId === 'none' || profile.cptsId === 'other') 
        ? null 
        : parseInt(profile.cptsId, 10);

      const payload = { 
        ...profile, 
        radius: parseInt(profile.radius),
        cptsId: parsedCptsId
      };
      
      await api.patch('/users/profile', payload);
      setIsSaveSuccess(true);
      setTimeout(() => setIsSaveSuccess(false), 2000);
    } catch (err: any) {
      if (err.response?.status === 400) {
        setErrors(prev => ({ ...prev, address: true }));
        scrollToError('address');
      } else {
        setGeneralError(err.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (profile.isValidated || !profile.address || profile.address.length < 3 || ignoreFetch.current) return setSuggestions([]);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(profile.address)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [profile.address, profile.isValidated]);

  const handleSelectAddress = (s: any) => {
    setProfile({
      ...profile,
      address: s.properties.label,
      lng: s.geometry.coordinates[0],
      lat: s.geometry.coordinates[1]
    });
    setSuggestions([]);
    ignoreFetch.current = true;
    clearError('address');
  };

  const inputClass = (hasError: boolean) => `
    w-full qisana-input placeholder:text-slate-400 
    ${hasError ? 'qisana-input-error' : ''} 
    ${profile.isValidated ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none focus:bg-slate-100 focus:border-slate-200' : 'bg-slate-50'}
  `.trim();

  return (
    <div className="qisana-card overflow-hidden font-sans">
      <header className="p-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col items-start min-w-0 max-w-full">
          <span className={`qisana-pill mb-3 ${profile.isValidated ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {profile.isValidated ? 'Compte validé' : 'En attente de validation'}
          </span>
          
          {profile.firstName || profile.lastName ? (
            <h2 className="flex flex-wrap items-baseline text-xl font-bold text-brand-navy tracking-tight gap-x-1.5 min-w-0 max-w-full">
              <span className="truncate max-w-full block">
                {profile.specialty === 'DOCTEUR' ? 'Dr ' : profile.gender === 'MALE' ? 'Mr ' : profile.gender === 'FEMALE' ? 'Mme ' : ''}
                {profile.firstName}
              </span>
              
              <span className="truncate max-w-full block">
                {profile.lastName}
              </span>
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-brand-navy tracking-tight">
              Dossier Professionnel
            </h2>
          )}
          
          <p className="text-sm text-surface-muted mt-1">Données professionnelles et visibilité</p>
        </div>
      </header>

      <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'grid-rows-[1fr] border-t border-brand-ice/60 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="label-title pl-1">Civilité</label>
              <select disabled={profile.isValidated} ref={setRef('gender')} className={inputClass(errors.gender)} value={profile.gender || ''} onChange={e => { setProfile({...profile, gender: e.target.value}); clearError('gender'); }}>
                <option value="">Sélectionner...</option>
                <option value="MALE">Monsieur</option>
                <option value="FEMALE">Madame</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="label-title pl-1">Prénom</label>
                <input disabled={profile.isValidated} ref={setRef('firstName')} type="text" maxLength={50} placeholder="Prénom" value={profile.firstName || ''} className={inputClass(errors.firstName)} onChange={e => { setProfile({...profile, firstName: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')}); clearError('firstName'); }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-title pl-1">Nom</label>
                <input disabled={profile.isValidated} ref={setRef('lastName')} type="text" maxLength={50} placeholder="Nom" value={profile.lastName || ''} className={inputClass(errors.lastName)} onChange={e => { setProfile({...profile, lastName: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')}); clearError('lastName'); }} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-title pl-1">Téléphone portable</label>
              <input disabled={profile.isValidated} ref={setRef('phone')} type="tel" placeholder="0612345678" value={profile.phone || ''} className={inputClass(errors.phone)} onChange={e => { setProfile({...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10)}); clearError('phone'); }} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="label-title pl-1">ADELI</label>
                <input disabled={profile.isValidated} ref={setRef('adeli')} type="text" maxLength={9} value={profile.adeli || ''} className={inputClass(errors.adeli)} onChange={e => { setProfile({...profile, adeli: e.target.value}); clearError('adeli'); }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-title pl-1">RPPS</label>
                <input disabled={profile.isValidated} ref={setRef('rpps')} type="text" maxLength={11} value={profile.rpps || ''} className={inputClass(errors.rpps)} onChange={e => { setProfile({...profile, rpps: e.target.value}); clearError('rpps'); }} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-title pl-1">CPTS</label>
              <select 
                disabled={profile.isValidated}
                className={inputClass(false)} 
                value={profile.cptsId || 'none'} 
                onChange={e => setProfile({...profile, cptsId: e.target.value})}
              >
                <option value="none">Aucune</option>
                {Object.entries(occitanieData).map(([dept, cptsList]) => (
                  <optgroup key={dept} label={dept}>
                    {cptsList.map((cpts: any) => (
                      <option key={cpts.id} value={cpts.id}>
                        {cpts.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-title pl-1">Spécialité</label>
              <select 
                disabled={profile.isValidated} 
                ref={setRef('specialty')} 
                className={inputClass(errors.specialty)} 
                value={profile.specialty || ''} 
                onChange={e => { setProfile({...profile, specialty: e.target.value}); clearError('specialty'); }}
              >
                <option value="">Sélectionner une spécialité...</option>
                <option value="DOCTEUR">Docteur</option>
                <option value="INFIRMIER">Infirmier(e)</option>
              </select>
            </div>

            <div ref={setRef('qualifications')} className="flex flex-col gap-2">
              <label className="label-title pl-1">Qualifications</label>
              <div className={`flex gap-2 flex-wrap p-1 rounded-2xl transition-all ${errors.qualifications ? 'border border-rose-500/60 bg-rose-50/20' : ''}`}>
                <button 
                  disabled={profile.isValidated}
                  type="button" 
                  onClick={() => {
                    setProfile({ ...profile, hasFormationDeces: !profile.hasFormationDeces });
                    clearError('qualifications');
                  }} 
                  className={`h-10 px-4 rounded-full text-xs font-bold border transition-all ${
                    profile.isValidated 
                      ? profile.hasFormationDeces ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : profile.hasFormationDeces 
                        ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                        : 'bg-white text-surface-muted border-brand-ice hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'
                  }`}
                >
                  Certificat décès
                </button>
                <button 
                  disabled={profile.isValidated}
                  type="button" 
                  onClick={() => {
                    setProfile({ ...profile, hasTeleconsultation: !profile.hasTeleconsultation });
                    clearError('qualifications');
                  }} 
                  className={`h-10 px-4 rounded-full text-xs font-bold border transition-all ${
                    profile.isValidated 
                      ? profile.hasTeleconsultation ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : profile.hasTeleconsultation 
                        ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                        : 'bg-white text-surface-muted border-brand-ice hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'
                  }`}
                >
                  Téléconsultation
                </button>
                <button 
                  disabled={profile.isValidated}
                  type="button" 
                  onClick={() => {
                    setProfile({ ...profile, hasPrado: !profile.hasPrado });
                    clearError('qualifications');
                  }} 
                  className={`h-10 px-4 rounded-full text-xs font-bold border transition-all ${
                    profile.isValidated 
                      ? profile.hasPrado ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : profile.hasPrado 
                        ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                        : 'bg-white text-surface-muted border-brand-ice hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'
                  }`}
                >
                  PRADO
                </button>
                <button 
                  disabled={profile.isValidated}
                  type="button" 
                  onClick={() => {
                    setProfile({ ...profile, hasPdsa: !profile.hasPdsa });
                    clearError('qualifications');
                  }} 
                  className={`h-10 px-4 rounded-full text-xs font-bold border transition-all ${
                    profile.isValidated 
                      ? profile.hasPdsa ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : profile.hasPdsa 
                        ? 'bg-brand-navy text-white border-brand-navy shadow-sm' 
                        : 'bg-white text-surface-muted border-brand-ice hover:border-brand-ice hover:bg-brand-ice/20 hover:text-brand-navy'
                  }`}
                >
                  PDSA
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="label-title pl-1">Adresse Professionnelle</label>
              <input disabled={profile.isValidated} ref={setRef('address')} type="text" placeholder="Ex: 12 rue de la Paix, Paris" value={profile.address || ''} className={inputClass(errors.address)} onChange={e => { setProfile({...profile, address: e.target.value}); ignoreFetch.current = false; clearError('address'); }} />
              {suggestions.length > 0 && !profile.isValidated && (
                <ul className="absolute bottom-full mb-2 left-0 w-full z-50 qisana-card shadow-xl overflow-hidden border border-brand-ice/60 bg-white">
                  {suggestions.map((s: any) => (
                    <li 
                      key={s.properties.id} 
                      className="px-4 py-3 text-sm hover:bg-brand-ice/20 cursor-pointer border-b border-brand-ice/30 last:border-0 transition-colors" 
                      onClick={() => handleSelectAddress(s)}
                    >
                      <span className="font-bold text-brand-navy">{s.properties.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center pl-1">
                <label className="label-title">Rayon d'action</label>
                <span className="text-xs font-bold text-brand-navy bg-brand-ice/40 border border-brand-ice px-2.5 py-0.5 rounded-md">
                  {profile.radius} km
                </span>
              </div>
              <div className="py-2 flex items-center">
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={profile.radius} 
                  className="w-full h-2 bg-brand-ice/60 rounded-lg appearance-none cursor-pointer accent-brand-navy" 
                  onChange={e => setProfile({...profile, radius: e.target.value})} 
                />
              </div>
            </div>

            {generalError && (
              <p className="text-xs font-semibold text-error-main bg-error-bg p-2.5 rounded-lg border border-error-main/20">
                {generalError}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full qisana-btn shadow-sm transition-all duration-300 disabled:opacity-50 ${isSaveSuccess ? 'animate-success qisana-btn-success' : ''}`}
            >
              {isSubmitting ? 'Sauvegarde...' : isSaveSuccess ? 'Profil mis à jour' : 'Sauvegarder les modifications'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
