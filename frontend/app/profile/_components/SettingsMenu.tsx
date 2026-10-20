'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function SettingsMenu({ profile, setProfile }: { profile: any, setProfile: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleUnlock = async () => {
    setIsSubmittingUnlock(true);
    setUnlockError(null);
    try {
      await api.patch('/users/profile/unlock');
      setProfile((prev: any) => ({ ...prev, isValidated: false }));
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      setUnlockError(err.response?.data?.message || 'Une erreur est survenue lors du déverrouillage.');
    } finally {
      setIsSubmittingUnlock(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await api.patch('/users/change-password', {
        oldPassword,
        newPassword
      });
      
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordModal(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Une erreur est survenue lors du changement.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const closePasswordModal = () => {
    if (isSubmittingPassword || passwordSuccess) return;
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  return (
    <div className="qisana-card overflow-hidden">
      <header 
        className="p-6 cursor-pointer flex justify-between items-center hover:bg-surface-subtle transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl font-bold text-brand-navy tracking-tight">Paramètres & Sécurité</h2>
          <p className="text-sm text-surface-muted mt-1">Options de compte et déconnexion</p>
        </div>
      </header>

      <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'grid-rows-[1fr] border-t border-brand-ice/50 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-6 space-y-3">
            {profile?.isValidated && (
              <button 
                onClick={() => setShowModal(true)} 
                className="w-full h-11 px-4 rounded-xl hover:bg-surface-subtle transition-colors text-sm font-bold text-brand-navy border border-brand-ice/50 bg-white cursor-pointer"
              >
                Modifier mes données professionnelles
              </button>
            )}
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full h-11 px-4 rounded-xl hover:bg-surface-subtle transition-colors text-sm font-bold text-brand-navy border border-brand-ice/50 bg-white cursor-pointer"
            >
              Changer de mot de passe
            </button>
            <button className="w-full h-11 px-4 rounded-xl hover:bg-surface-subtle transition-colors text-sm font-bold text-brand-navy border border-brand-ice/50 bg-white cursor-pointer">
              Conditions Générales d'Utilisation
            </button>
            <button 
              onClick={handleLogout} 
              className="w-full h-11 px-4 rounded-xl hover:bg-error-bg transition-colors text-sm font-bold text-error-main border border-error-main/20 bg-error-bg/50 mt-2 cursor-pointer"
            >
              Déconnexion du compte
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-brand-ice/50">
            <h3 className="text-lg font-bold text-brand-navy">Confirmer la modification</h3>
            <p className="text-sm text-surface-muted mt-2">
              Le déverrouillage de vos informations professionnelles basculera votre profil en statut « En attente de validation ». Souhaitez-vous continuer ?
            </p>

            {unlockError && (
              <p className="text-xs font-semibold text-error-main bg-error-bg p-2.5 rounded-lg border border-error-main/20 mt-4">
                {unlockError}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                disabled={isSubmittingUnlock}
                onClick={() => {
                  setShowModal(false);
                  setUnlockError(null);
                }} 
                className="h-10 px-4 rounded-lg border border-surface-border text-sm font-medium text-surface-muted hover:bg-surface-subtle transition-colors disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>
              <button 
                disabled={isSubmittingUnlock}
                onClick={handleUnlock} 
                className="qisana-btn h-10 px-4 font-bold disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingUnlock ? 'Chargement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-brand-ice/50">
            <h3 className="text-lg font-bold text-brand-navy mb-4">Changer votre mot de passe</h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="label-title text-surface-muted pl-1">Mot de passe actuel</label>
                <input 
                  type="password" 
                  disabled={isSubmittingPassword || passwordSuccess}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="••••••••" 
                  className={`qisana-input w-full ${passwordError && !oldPassword ? 'qisana-input-error' : ''}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label-title text-surface-muted pl-1">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  disabled={isSubmittingPassword || passwordSuccess}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères" 
                  className={`qisana-input w-full ${passwordError && (newPassword.length < 8 || newPassword !== confirmPassword) ? 'qisana-input-error' : ''}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label-title text-surface-muted pl-1">Confirmer le nouveau mot de passe</label>
                <input 
                  type="password" 
                  disabled={isSubmittingPassword || passwordSuccess}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer" 
                  className={`qisana-input w-full ${passwordError && newPassword !== confirmPassword ? 'qisana-input-error' : ''}`}
                />
              </div>

              {passwordError && (
                <p className="text-xs font-semibold text-error-main bg-error-bg p-2.5 rounded-lg border border-error-main/20">
                  {passwordError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  disabled={isSubmittingPassword || passwordSuccess}
                  onClick={closePasswordModal} 
                  className="h-11 px-4 rounded-xl border border-surface-border text-sm font-medium text-surface-muted hover:bg-surface-subtle transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingPassword || passwordSuccess}
                  className={`qisana-btn font-bold px-5 min-w-[140px] transition-all duration-300 ${passwordSuccess ? 'qisana-btn-success' : ''}`}
                >
                  {isSubmittingPassword ? 'Envoi...' : passwordSuccess ? 'Modifié !' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
