'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit-logs')
      .then(res => {
        if (Array.isArray(res.data)) {
          const managementActions = [
            'SOFT_DELETE', 'RESTORE', 'VALIDATE', 'CREATE_USER',
            'soft_delete', 'restore', 'validate', 'create_user',
            'DELETE', 'delete'
          ];
          setLogs(res.data.filter((log: any) => managementActions.includes(log.action)));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const getActionConfig = (action: string) => {
    const normalized = action.toUpperCase();
    switch (normalized) {
      case 'SOFT_DELETE':
      case 'DELETE':
        return { label: 'Suppression', color: '!bg-rose-50 !text-rose-700 !border-rose-100' };
      case 'RESTORE': 
        return { label: 'Restauration', color: '!bg-blue-50 !text-blue-700 !border-blue-100' };
      case 'VALIDATE': 
        return { label: 'Validation', color: '!bg-emerald-50 !text-emerald-700 !border-emerald-200' };
      case 'CREATE_USER':
        return { label: 'Création', color: '!bg-purple-50 !text-purple-700 !border-purple-100' };
      default: 
        return { label: action, color: '!bg-slate-100 !text-slate-600 !border-slate-200' };
    }
  };

  const getTargetUserDisplay = (log: any) => {
    const details = (log.details as any) || {};
    const profile = details.profile || details.user?.profile || {};

    let gender = log.targetGender || details.targetGender || details.gender || profile.gender;
    let specialty = log.targetSpecialty || details.targetSpecialty || details.specialty || profile.specialty;
    
    let firstName = log.targetFirstName || details.targetFirstName || details.firstName || profile.firstName || '';
    let lastName = log.targetLastName || details.targetLastName || details.lastName || profile.lastName || '';
    let fallbackName = log.targetName || details.targetName || details.user?.name;

    let isDoctorFromFallback = false;

    if (fallbackName) {
      let cleanedName = fallbackName.trim();
      const upperFallback = cleanedName.toUpperCase();
      
      if (upperFallback.startsWith('DR ') || upperFallback.startsWith('DR.')) {
        isDoctorFromFallback = true;
        cleanedName = cleanedName.replace(/^DR\.?\s+/i, '');
      } else if (upperFallback.startsWith('MR ') || upperFallback.startsWith('MR.')) {
        gender = 'MALE';
        cleanedName = cleanedName.replace(/^MR\.?\s+/i, '');
      } else if (upperFallback.startsWith('MME ') || upperFallback.startsWith('MME.')) {
        gender = 'FEMALE';
        cleanedName = cleanedName.replace(/^MME\.?\s+/i, '');
      }

      if (!firstName && !lastName) {
        const parts = cleanedName.split(/\s+/);
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          firstName = cleanedName;
        }
      }
    }

    if (!firstName && !lastName) return null;

    const normalizedSpecialty = specialty?.toUpperCase();
    const isNurse = normalizedSpecialty === 'INFIRMIER';
    
    const isHealthPro = log.targetRole?.toUpperCase() === 'HEALTH_PRO' || 
                        details.targetRole?.toUpperCase() === 'HEALTH_PRO' || 
                        details.role?.toUpperCase() === 'HEALTH_PRO';
    
    const isDoctor = normalizedSpecialty === 'DOCTEUR' || 
                     normalizedSpecialty === 'DOCTOR' || 
                     isDoctorFromFallback || 
                     (isHealthPro && !isNurse);

    const civility = isDoctor ? 'Dr ' : gender === 'MALE' ? 'Mr ' : gender === 'FEMALE' ? 'Mme ' : '';

    return (
      <div className="w-full block text-center text-xs text-slate-500 font-medium mt-1 truncate">
        {civility}{firstName}{lastName ? ` ${lastName}` : ''}
      </div>
    );
  };

  if (loading) {
    return <div className="p-12 text-center text-sm font-bold text-slate-500 animate-pulse">Chargement...</div>;
  }

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Journal d'Opération</h1>
      <div className="qisana-card w-full overflow-hidden">
        <table className="w-full table-fixed divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th style={{ width: '20%' }} className="px-6 py-4 text-center label-title">Horodatage</th>
              <th style={{ width: '25%' }} className="px-6 py-4 text-center label-title">Admin</th>
              <th style={{ width: '15%' }} className="px-6 py-4 text-center label-title">Action</th>
              <th style={{ width: '40%' }} className="px-6 py-4 text-center label-title">Utilisateur Cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                  Aucun log d'audit
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const config = getActionConfig(log.action);
                
                const details = (log.details as any) || {};
                const profile = details.profile || details.user?.profile || {};
                const hasSubName = !!(
                  log.targetFirstName || log.targetLastName || 
                  details.targetFirstName || details.targetLastName || 
                  details.firstName || details.lastName || 
                  profile.firstName || profile.lastName ||
                  log.targetName || details.targetName || details.user?.name
                );
                
                const targetRole = log.targetRole?.toUpperCase() || details.targetRole?.toUpperCase() || details.role?.toUpperCase();
                const isTargetHealthPro = targetRole === 'HEALTH_PRO';
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-700 truncate">
                      {log.adminEmail || 'Système'}
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap overflow-hidden">
                      <span className={`qisana-pill !text-xs font-bold ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-900 min-w-0 max-w-0 overflow-hidden">
                      <div className="w-full block text-center px-1">
                        <span className="truncate w-full block text-center">
                          {log.targetEmail || details.targetEmail || details.email || 'N/A'}
                        </span>
                        {isTargetHealthPro && hasSubName && getTargetUserDisplay(log)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
