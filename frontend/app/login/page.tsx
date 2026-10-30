'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
            <label htmlFor="email" className="label-title text-surface-muted block text-sm font-medium">
              Email
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full qisana-input" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="label-title text-surface-muted block text-sm font-medium">
                Mot de passe
              </label>
            </div>
            
            <div className="relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? 'text' : 'password'} 
                required 
                className="w-full qisana-input pr-10" 
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-muted hover:text-brand-navy focus:outline-none"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <Link href="/forgot-password" className="text-xs text-brand-navy font-semibold hover:underline">
                Oublié ?
              </Link>
            </div>
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
