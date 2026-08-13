'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Identifiants invalides.');
      return;
    }

    if (!password || password.length < 1) {
      setError('Identifiants invalides.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const userRole = res.data.user.role;
      
      const roleRoutes: Record<string, string> = {
        HEALTH_PRO: '/profile',
        ADMIN: '/admin/users',
        COORDINATOR: '/dashboard',
      };
      
      const target = roleRoutes[userRole] || '/';
      window.location.href = target;
      
    } catch (err: any) {
      setError('Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base font-sans p-4">
      <div className="w-full max-w-md qisana-card p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-navy tracking-tight">Qisana</h1>
          <p className="text-surface-muted mt-2 font-medium">Portail de Coordination</p>
        </div>
        
        {error && (
          <div className="bg-error-bg border border-error-main/20 text-error-main p-4 mb-6 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} noValidate className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="label-title text-surface-muted block text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" required className="w-full qisana-input" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="label-title text-surface-muted block text-sm font-medium">Mot de passe</label>
              <Link href="/forgot-password" className="text-xs text-brand-navy font-semibold hover:underline">
                Oublié ?
              </Link>
            </div>
            <input id="password" name="password" type="password" required className="w-full qisana-input" />
          </div>
          <button type="submit" disabled={loading} className="w-full qisana-btn font-bold">
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-brand-ice/50">
          <p className="text-sm text-surface-muted">
            Nouveau sur Qisana ?{' '}
            <Link href="/register" className="text-brand-navy font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
