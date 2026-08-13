'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    api.get('/users/me')
      .then(res => {
        const role = res.data.role;
        if (role === 'HEALTH_PRO') {
          router.push('/profile');
        } else if (role === 'ADMIN') {
          router.push('/admin/users');
        } else if (role === 'COORDINATOR') {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-navy mx-auto"></div>
        <p className="mt-4 label-title text-surface-muted animate-pulse">Chargement de votre espace...</p>
      </div>
    </div>
  );
}
