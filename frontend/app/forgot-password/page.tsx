'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message;
      setError(Array.isArray(errorMsg) ? errorMsg.join(' • ') : (errorMsg || 'Une erreur est survenue. Veuillez réessayer.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base font-sans p-4">
      <div className="w-full max-w-md qisana-card p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-navy tracking-tight">Qisana</h1>
          <p className="text-surface-muted mt-2 font-medium">Mot de passe oublié</p>
        </div>
        
        {error && (
          <div className="bg-error-bg border border-error-main/20 text-error-main p-4 mb-6 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center animate-in fade-in">
            <div className="bg-success-bg border border-success-main/20 text-success-main p-5 text-sm rounded-xl font-medium text-left">
              Si ce compte existe, un email contenant les instructions de réinitialisation vous a été envoyé.
            </div>
            <Link href="/login" className="w-full qisana-btn flex items-center justify-center font-bold text-center">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-6">
            <p className="text-sm text-surface-muted leading-relaxed">
              Saisissez votre adresse email ci-dessous. Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
            </p>
            <div className="space-y-2">
              <label htmlFor="email" className="label-title text-surface-muted block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" required disabled={loading} className="w-full qisana-input" />
            </div>
            <button type="submit" disabled={loading} className="w-full qisana-btn font-bold">
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
            </button>
          </form>
        )}

        {!success && (
          <div className="text-center mt-6 pt-5 border-t border-brand-ice/50">
            <Link href="/login" className="text-sm text-brand-navy font-semibold hover:underline">
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
