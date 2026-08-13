'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

function VerificationHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Validation de votre adresse email en cours...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Jeton de validation manquant.');
      return;
    }

    api.get(`/users/verify/${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Votre adresse email a été validée avec succès ! Vous pouvez maintenant vous connecter.');
      })
      .catch((err) => {
        setStatus('error');
        const errorMsg = err.response?.data?.message || 'Le lien de validation est invalide ou a expiré.';
        setMessage(errorMsg);
      });
  }, [token]);

  return (
    <div className="mb-8">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-surface-muted font-medium">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-bg text-success-main">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-brand-navy font-medium">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-bg text-error-main">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-error-main font-medium">{message}</p>
        </div>
      )}

      {status !== 'loading' && (
        <Link href="/login" className="w-full qisana-btn font-bold flex justify-center items-center mt-6 h-11">
          Retour à la page de connexion
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base font-sans p-4">
      <div className="w-full max-w-md qisana-card p-10 shadow-2xl text-center">
        <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight mb-6">Qisana</h1>
        
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-surface-muted font-medium">Chargement...</p>
          </div>
        }>
          <VerificationHandler />
        </Suspense>
      </div>
    </div>
  );
}
