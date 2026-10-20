'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProfileForm from './_components/ProfileForm';
import ScheduleManager from './_components/ScheduleManager';
import SettingsMenu from './_components/SettingsMenu';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ 
    email: '', 
    gender: '',
    firstName: '',
    lastName: '',
    phone: '',
    adeli: '',
    rpps: '',
    specialty: '', 
    cptsId: 'none',
    hasFormationDeces: false,
    hasTeleconsultation: false,
    address: '', 
    radius: 30,
    isValidated: false
  });
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, availRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/users/availability/me') 
        ]);
        
        const p = userRes.data.profile;
        setProfile({
          email: userRes.data.email,
          gender: p?.gender || '',
          firstName: p?.firstName || '',
          lastName: p?.lastName || '',
          phone: p?.phone || '', 
          adeli: p?.adeli || '',
          rpps: p?.rpps || '',
          specialty: p?.specialty || '',
          cptsId: p?.cptsId || 'none',
          hasFormationDeces: p?.hasFormationDeces || false,
          hasTeleconsultation: p?.hasTeleconsultation || false,
          address: p?.address || '',
          radius: p?.radius || 30,
          isValidated: p?.isValidated || false
        });
        setShifts(availRes.data || []);
      } catch (err: any) {
        console.error(err);
        setPageError('Impossible de charger vos données. Veuillez rafraîchir la page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center label-title text-surface-muted animate-pulse">Chargement de votre espace...</div>;

  if (pageError) return (
    <div className="p-12 text-center font-sans">
      <div className="max-w-md mx-auto bg-error-bg text-error-main p-6 rounded-xl border border-error-main/20">
        <p className="font-bold text-sm mb-4">{pageError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="qisana-btn h-10 px-4 text-xs font-bold"
        >
          Recharger la page
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-base p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <ProfileForm profile={profile} setProfile={setProfile} />
          <SettingsMenu profile={profile} setProfile={setProfile} />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <ScheduleManager shifts={shifts} setShifts={setShifts} />
        </div>
      </div>
    </div>
  );
}
