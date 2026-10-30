'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        router.push('/login');
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [success, router]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/users/register', { 
        email, 
        password,
        role: 'HEALTH_PRO'
      });
      setSuccess(true);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message;
      setError(Array.isArray(errorMsg) ? errorMsg.join(' • ') : (errorMsg || "Une erreur est survenue lors de l'inscription."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base font-sans p-4">
      <div className="w-full max-w-md qisana-card p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-navy tracking-tight">Qisana</h1>
          <p className="text-surface-muted mt-2 font-medium">Créer un compte Professionnel de Santé</p>
        </div>
        
        {error && (
          <div className="bg-error-bg border border-error-main/20 text-error-main p-4 mb-6 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-success-bg border border-success-main/20 text-success-main p-5 text-sm rounded-xl font-medium space-y-2">
              <p className="font-bold text-success-main">E-mail de validation envoyé !</p>
              <p>Veuillez vérifier votre boîte de réception pour valider votre adresse e-mail avant de vous connecter.</p>
            </div>
            <p className="text-xs text-center text-surface-muted italic">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} noValidate className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="label-title text-surface-muted block text-sm font-medium">Email professionnel</label>
              <input id="email" name="email" type="email" required disabled={loading} className="w-full qisana-input" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="label-title text-surface-muted block text-sm font-medium">Mot de passe</label>
              <input id="password" name="password" type="password" required disabled={loading} className="w-full qisana-input" />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="label-title text-surface-muted block text-sm font-medium">Confirmer le mot de passe</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required disabled={loading} className="w-full qisana-input" />
            </div>
            
            <button type="submit" disabled={loading} className="w-full qisana-btn font-bold mt-2">
              {loading ? 'Inscription en cours...' : "S'inscrire"}
            </button>
          </form>
        )}

        {!success && (
          <div className="text-center mt-6 pt-5 border-t border-brand-ice/50">
            <p className="text-sm text-surface-muted">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="text-brand-navy font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
