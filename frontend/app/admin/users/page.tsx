'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

type UserRole = 'ALL' | 'HEALTH_PRO' | 'COORDINATOR' | 'ADMIN';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<UserRole>('ALL');
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'HEALTH_PRO', password: '', confirmPassword: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const meRes = await api.get('/users/me').catch(() => null);
      if (meRes?.data) {
        setCurrentUser(meRes.data);
      }
      const usersRes = await api.get('/users');
      setUsers(Array.isArray(usersRes.data) ? usersRes.data.sort((a: any, b: any) => a.id - b.id) : []);
    } catch (err) { 
      setUsers([]);
    } finally { 
      setLoading(false);
    }
  };

  const handleAction = async (e: React.MouseEvent, id: number, action: string) => {
    e.stopPropagation();
    try {
      if (action === 'restore') {
        await api.patch(`/users/${id}/restore`);
      } else if (action === 'validate') {
        await api.patch(`/users/${id}/validate`);
      } else {
        await api.delete(`/users/${id}`);
      }
      fetchData();
    } catch (err) { 
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    setIsSubmitting(true);

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Veuillez remplir tous les champs.');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Veuillez entrer une adresse email valide.');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post('/users/admin/create', {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      setFormSuccess(true);
      setTimeout(() => {
        setFormData({ email: '', role: 'HEALTH_PRO', password: '', confirmPassword: '' });
        setShowCreateForm(false);
        setFormSuccess(false);
        fetchData();
        setIsSubmitting(false);
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message;
      setFormError(Array.isArray(errorMsg) ? errorMsg.join(' • ') : (errorMsg || "Une erreur est survenue lors de la création."));
      setIsSubmitting(false);
    }
  };

  const getDeletionDate = (deletedAt: string) => {
    const date = new Date(deletedAt);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatEnum = (val: string | null, gender?: string) => {
    if (!val) return 'Non renseigné';
    const normalized = val.toUpperCase();
    if (normalized === 'INFIRMIER' && gender === 'FEMALE') {
      return 'Infirmière';
    }
    return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const hasUserProfileName = (user: any) => {
    return !!(user.profile?.firstName || user.profile?.lastName);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const filteredUsers = users.filter((user) => {
    if (activeTab === 'ALL') return true;
    return user.role === activeTab;
  });

  if (loading) {
    return <div className="p-12 text-center text-sm font-bold text-surface-muted animate-pulse">Chargement...</div>;
  }

  return (
    <div className="p-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy tracking-tight">Gestion des Utilisateurs</h1>
        </div>
        <button 
          onClick={() => {
            setFormData({ email: '', role: 'HEALTH_PRO', password: '', confirmPassword: '' });
            setFormError(null);
            setFormSuccess(false);
            setShowCreateForm(true);
          }}
          className="qisana-btn text-sm font-bold shadow-sm"
        >
          Ajouter un utilisateur
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-surface-dark/40 backdrop-blur-sm p-4">
          <div className="qisana-card w-full max-w-md p-8 bg-white shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-surface-muted hover:text-brand-navy transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-brand-navy tracking-tight">Nouvel utilisateur</h3>
            </div>

            {formError && (
              <div className="bg-error-bg border border-error-main/20 text-error-main p-3 mb-5 text-sm rounded-xl font-medium">
                {formError}
              </div>
            )}

            {formSuccess ? (
              <div className="bg-success-bg border border-success-main/20 text-success-main p-4 text-sm rounded-xl font-medium text-center">
                Compte créé avec succès !
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="label-title block text-sm font-medium">Rôle</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full qisana-input text-sm font-bold bg-white"
                    disabled={isSubmitting}
                  >
                    <option value="HEALTH_PRO">Professionnel de Santé</option>
                    <option value="COORDINATOR">Coordinateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="label-title block text-sm font-medium">Email professionnel</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full qisana-input text-sm font-bold" 
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-title block text-sm font-medium">Mot de passe</label>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full qisana-input text-sm font-bold" 
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-title block text-sm font-medium">Confirmer le mot de passe</label>
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full qisana-input text-sm font-bold" 
                    disabled={isSubmitting}
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full qisana-btn font-bold mt-2">
                  {isSubmitting ? 'Création en cours...' : 'Ajouter'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', 'HEALTH_PRO', 'COORDINATOR', 'ADMIN'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setExpandedUserId(null); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full border border-transparent transition-all ${
              activeTab === tab 
                ? 'bg-brand-navy text-white shadow-sm' 
                : 'bg-white border-brand-ice text-brand-navy'
            }`}
          >
            {tab === 'ALL' && 'Tous'}
            {tab === 'HEALTH_PRO' && 'Professionnels de Santé'}
            {tab === 'COORDINATOR' && 'Coordinateurs'}
            {tab === 'ADMIN' && 'Administrateurs'}
          </button>
        ))}
      </div>

      <div className="qisana-card w-full overflow-hidden">
        <table className="w-full table-fixed divide-y divide-brand-ice/50">
          <thead className="bg-surface-base">
            <tr>
              <th style={{ width: '34%' }} className="px-6 py-4 text-center label-title">Utilisateur</th>
              <th style={{ width: '22%' }} className="px-6 py-4 text-center label-title">Rôle</th>
              <th style={{ width: '22%' }} className="px-6 py-4 text-center label-title">Statut</th>
              <th style={{ width: '22%' }} className="px-6 py-4 text-center label-title">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-brand-ice/50">
            {filteredUsers.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-surface-muted">Aucun utilisateur trouvé dans cette catégorie</td></tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = currentUser != null && Number(user.id) === Number(currentUser.id);
                return (
                  <React.Fragment key={user.id}>
                    <tr 
                      onClick={() => user.role === 'HEALTH_PRO' && setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      className={`transition-colors ${user.role === 'HEALTH_PRO' ? 'cursor-pointer hover:bg-surface-base' : ''} ${expandedUserId === user.id ? 'bg-surface-base' : ''}`}
                    >
                      <td className="px-6 py-5 text-center min-w-0 max-w-0 overflow-hidden">
                        <div className="text-sm font-bold text-brand-navy tracking-tight w-full px-2">
                          {hasUserProfileName(user) ? (
                            <div className="truncate w-full block text-center whitespace-nowrap">
                              {(user.role === 'HEALTH_PRO' && user.profile?.specialty?.toUpperCase() !== 'INFIRMIER') ? 'Dr ' : user.profile.gender === 'MALE' ? 'Mr ' : user.profile.gender === 'FEMALE' ? 'Mme ' : ''}
                              {user.profile.firstName} {user.profile.lastName}
                            </div>
                          ) : (
                            <p className="truncate w-full block text-center whitespace-nowrap">{user.email}</p>
                          )}
                        </div>
                        {user.role === 'HEALTH_PRO' && (
                          <div className="text-xs text-surface-muted font-bold mt-1 truncate w-full block px-2 text-center whitespace-nowrap">
                            {user.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap overflow-hidden">
                        <span className="qisana-pill bg-surface-base text-surface-muted border-brand-ice">{user.role}</span>
                      </td>
                      <td className="px-6 py-5 text-center overflow-hidden">
                        {user.deletedAt ? (
                          <span className="qisana-pill bg-error-bg text-error-main border-error-main/20 inline-flex whitespace-normal break-words max-w-[170px] text-center leading-snug rounded-xl">Suppression le {getDeletionDate(user.deletedAt)}</span>
                        ) : (
                          user.role === 'HEALTH_PRO' ? (
                            user.profile?.isValidated
                              ? <span className="qisana-pill bg-success-bg text-success-main border-success-main/20">Validé</span>
                              : <span className="qisana-pill bg-error-bg text-error-main border-error-main/20">En attente de validation</span>
                          ) : (
                            <span className="text-xs text-surface-muted font-bold">Actif</span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap overflow-hidden">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {!user.deletedAt && user.role === 'HEALTH_PRO' && !user.profile?.isValidated && (
                            <button onClick={(e) => handleAction(e, user.id, 'validate')} className="qisana-pill bg-white text-brand-navy border-brand-ice hover:bg-brand-ice/30 hover:border-brand-ice cursor-pointer shadow-sm hover:shadow-md transition-all">Valider</button>
                          )}
                          {isSelf ? null : user.deletedAt ? (
                            <button onClick={(e) => handleAction(e, user.id, 'restore')} className="qisana-pill bg-brand-navy text-white border-brand-navy hover:bg-brand-navy/90 cursor-pointer shadow-sm transition-colors">Restaurer</button>
                          ) : (
                            <button onClick={(e) => handleAction(e, user.id, 'delete')} className="qisana-pill bg-surface-dark text-white border-surface-dark hover:bg-surface-dark/90 cursor-pointer shadow-sm transition-colors">Désactiver</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {user.role === 'HEALTH_PRO' && (
                      <tr className="border-0 m-0">
                        <td colSpan={4} className="p-0">
                          <div className={`grid transition-all duration-300 ease-in-out ${expandedUserId === user.id ? 'grid-rows-[1fr] border-b border-brand-ice/50 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden bg-surface-base/50">
                              <div className="w-full px-12 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="flex flex-col space-y-1.5 min-w-0 max-w-full overflow-hidden">
                                  <p className="label-title">Contact</p>
                                  {hasUserProfileName(user) ? (
                                    <div className="text-sm font-bold text-brand-navy tracking-tight w-full truncate block whitespace-nowrap">
                                      {(user.role === 'HEALTH_PRO' && user.profile?.specialty?.toUpperCase() !== 'INFIRMIER') ? 'Dr ' : user.profile.gender === 'MALE' ? 'Mr ' : user.profile.gender === 'FEMALE' ? 'Mme ' : ''}
                                      {user.profile.firstName} {user.profile.lastName}
                                    </div>
                                  ) : (
                                    <p className="text-sm font-bold text-brand-navy truncate w-full block whitespace-nowrap">{user.email}</p>
                                  )}
                                  <p className="text-sm font-bold text-brand-navy truncate w-full block whitespace-nowrap">{user.profile?.phone || '—'}</p>
                                  <p className="text-sm font-bold text-surface-muted text-xs truncate w-full block whitespace-nowrap">{user.email}</p>
                                </div>
                                <div className="flex flex-col space-y-1.5 min-w-0 max-w-full overflow-hidden">
                                  <p className="label-title">Identifiants Pro</p>
                                  <p className="text-sm font-bold text-brand-navy truncate w-full block whitespace-nowrap">ADELI: {user.profile?.adeli || '—'}</p>
                                  <p className="text-sm font-bold text-brand-navy truncate w-full block whitespace-nowrap">RPPS: {user.profile?.rpps || '—'}</p>
                                </div>
                                <div className="flex flex-col space-y-1.5 min-w-0 max-w-full overflow-hidden">
                                  <p className="label-title">Spécialité & Missions</p>
                                  <p className="text-sm font-bold text-brand-navy truncate w-full block whitespace-nowrap">{formatEnum(user.profile?.specialty, user.profile?.gender)}</p>
                                  <p className="text-sm font-bold text-brand-navy truncate w-full block whitespace-nowrap">{user.profile?.cpts?.name || 'CPTS non renseignée'}</p>
                                  {user.profile?.hasFormationDeces && <p className="text-sm font-bold text-brand-navy whitespace-nowrap">Certificat Décès</p>}
                                  {user.profile?.hasTeleconsultation && <p className="text-sm font-bold text-brand-navy whitespace-nowrap">Téléconsultation</p>}
                                </div>
                                <div className="flex flex-col space-y-1.5 min-w-0 max-w-full overflow-hidden">
                                  <p className="label-title">Localisation ({user.profile?.radius} km)</p>
                                  <p className="text-sm font-bold text-brand-navy leading-[1.5] break-words">
                                    {user.profile?.address || '—'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
