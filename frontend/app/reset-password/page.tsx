'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 4000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message;
      setError(Array.isArray(errorMsg) ? errorMsg.join(' • ') : (errorMsg || 'Une erreur est survenue.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base font-sans p-4">
      <div className="w-full max-w-md qisana-card p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-navy tracking-tight">Qisana</h1>
          <p className="text-surface-muted mt-2 font-medium">Nouveau mot de passe</p>
        </div>

        {error && (
          <div className="bg-error-bg border border-error-main/20 text-error-main p-4 mb-6 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center animate-in fade-in">
            <div className="bg-success-bg border border-success-main/20 text-success-main p-5 text-sm rounded-xl font-medium text-left">
              Mot de passe réinitialisé avec succès ! Redirection vers la connexion...
            </div>
            <Link href="/login" className="w-full qisana-btn flex items-center justify-center font-bold text-center">
              Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <label className="label-title text-surface-muted block text-sm font-medium">Nouveau mot de passe</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={loading} 
                className="w-full qisana-input" 
              />
            </div>
            <div className="space-y-2">
              <label className="label-title text-surface-muted block text-sm font-medium">Confirmer le mot de passe</label>
              <input 
                type="password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                disabled={loading} 
                className="w-full qisana-input" 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full qisana-btn flex items-center justify-center font-bold mt-2">
              {loading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
