'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
        newPassword,
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

  const linkClass = (path: string) => `
    block p-3 rounded-xl transition-colors text-sm font-bold
    ${pathname === path ? 'bg-brand-navy text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}
  `;

  return (
    <div className="flex min-h-screen bg-surface-base font-sans">
      <aside className="w-64 bg-surface-dark text-white flex flex-col shadow-xl z-10 relative">
        <div className="p-6 text-xl font-bold border-b border-white/10 tracking-tight text-white">
          Administration
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <Link href="/admin/users" className={linkClass('/admin/users')}>
            Gestion des Utilisateurs
          </Link>
          <Link href="/admin/activity" className={linkClass('/admin/activity')}>
            Journal d'Activité
          </Link>
          <Link href="/admin/logs" className={linkClass('/admin/logs')}>
            Journal d'Opération
          </Link>
          <Link href="/admin/reports" className={linkClass('/admin/reports')}>
            Rapports Mensuels
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 relative" ref={dropdownRef}>
          {isOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 text-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowPasswordModal(true);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-surface-subtle transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
                </svg>
                Changer de mot de passe
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-surface-subtle transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Conditions Générales (CGU)
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-error-main hover:bg-error-bg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-error-main" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Paramètres
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-brand-ice/50 text-slate-800">
            <h3 className="text-lg font-bold text-brand-navy mb-4">Changer votre mot de passe</h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="label-title text-surface-muted pl-1 text-xs font-medium">Mot de passe actuel</label>
                <input
                  type="password"
                  disabled={isSubmittingPassword || passwordSuccess}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`qisana-input w-full ${passwordError && !oldPassword ? 'qisana-input-error' : ''}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label-title text-surface-muted pl-1 text-xs font-medium">Nouveau mot de passe</label>
                <input
                  type="password"
                  disabled={isSubmittingPassword || passwordSuccess}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className={`qisana-input w-full ${passwordError && (newPassword.length < 8 || newPassword !== confirmPassword) ? 'qisana-input-error' : ''}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label-title text-surface-muted pl-1 text-xs font-medium">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  disabled={isSubmittingPassword || passwordSuccess}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
