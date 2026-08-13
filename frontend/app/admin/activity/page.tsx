'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ActivityJournalPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/audit-logs')
      .then(res => {
        if (Array.isArray(res.data)) {
          setActivities(res.data.filter((log: any) => log.action === 'MAP_SEARCH'));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatEnum = (val: string | null, gender?: string) => {
    if (!val) return 'Généraliste';
    const normalized = val.toUpperCase();
    if (normalized === 'INFIRMIER' && gender === 'FEMALE') return 'Infirmière';
    return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null || ms <= 0) return '—';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
  };

  const renderFilters = (filters: any) => {
    if (!filters) return <span className="text-xs text-slate-400 italic">Aucun filtre (Téléconsultation)</span>;
    
    const active = [];
    if (filters.specialty === 'DOCTOR') active.push('Médecin');
    if (filters.specialty === 'NURSE') active.push('Infirmier');
    if (filters.hasFormationDeces || filters.deathCertificate) active.push('Certificat de Décès');
    if (filters.hasTeleconsultation || filters.teleconsultation) active.push('Téléconsultation');
    
    if (active.length === 0) return <span className="text-xs text-slate-400 italic">Aucun filtre (Téléconsultation)</span>;
    
    return (
      <div className="flex flex-wrap gap-1.5">
        {active.map((f, i) => (
          <span key={i} className="qisana-pill !bg-blue-50 !border-blue-100 !text-blue-700 font-bold !text-[11px]">
            {f}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-12 text-center text-sm font-bold text-slate-500 animate-pulse">Chargement...</div>;
  }

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Journal d'Activité</h1>
      <div className="qisana-card w-full overflow-hidden">
        <table className="w-full table-fixed divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th style={{ width: '18%' }} className="px-6 py-4 text-center label-title">Horodatage</th>
              <th style={{ width: '24%' }} className="px-6 py-4 text-center label-title">Coordinateur</th>
              <th style={{ width: '33%' }} className="px-6 py-4 text-center label-title">Adresse Recherchée</th>
              <th style={{ width: '25%' }} className="px-6 py-4 text-center label-title">Résultat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                  Aucune recherche enregistrée
                </td>
              </tr>
            ) : (
              activities.map((log) => {
                const confirmedPro = log.details.interactions?.find((inter: any) => inter.status === 'CONFIRMED');

                return (
                  <React.Fragment key={log.id}>
                    <tr 
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      className={`transition-colors cursor-pointer hover:bg-slate-50 ${expandedLogId === log.id ? 'bg-slate-50' : ''}`}
                    >
                      <td className="px-6 py-5 text-center text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-5 text-center truncate max-w-0">
                        <span className="text-sm font-bold text-slate-700 block truncate">{log.adminEmail}</span>
                      </td>
                      <td className="px-6 py-5 text-center max-w-0">
                        <span className="text-sm font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block truncate max-w-full">
                          {log.details.address}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap overflow-hidden">
                        {confirmedPro ? (
                          <span className="qisana-pill !bg-emerald-50 !border-emerald-100 !text-emerald-700 font-bold !text-[11px]">
                            Validé
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                    
                    <tr className="border-0 m-0">
                      <td colSpan={4} className="p-0">
                        <div className={`grid transition-all duration-300 ease-in-out ${expandedLogId === log.id ? 'grid-rows-[1fr] border-b border-slate-100 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden bg-slate-50/60">
                            <div className="w-full px-12 py-6 text-left">
                              <div className="flex flex-col md:flex-row gap-8 bg-white border border-slate-100 rounded-xl p-6 shadow-sm max-w-5xl">
                                
                                <div className="flex-1 space-y-4">
                                  <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1.5">Résumé de la recherche</p>
                                    <div className="text-xs text-slate-600 space-y-1">
                                      <p>Temps total passé : <span className="font-bold text-slate-800">{formatDuration(log.durationMs)}</span></p>
                                      <p>Professionnels consultés : <span className="font-bold text-slate-800">{log.clickCount}</span></p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1.5">Filtres utilisés</p>
                                    {renderFilters(log.details.filters)}
                                  </div>
                                </div>

                                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 flex flex-col justify-center">
                                  <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-2">Professionnel validé</p>
                                  {confirmedPro ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 truncate">
                                          {confirmedPro.firstName || confirmedPro.lastName 
                                            ? `${confirmedPro.specialty === 'DOCTEUR' ? 'Dr ' : confirmedPro.gender === 'MALE' ? 'Mr ' : confirmedPro.gender === 'FEMALE' ? 'Mme ' : ''}${confirmedPro.firstName || ''} ${confirmedPro.lastName || ''}`
                                            : confirmedPro.email}
                                        </span>
                                        <span className="qisana-pill !text-[9px] !py-0.5 !px-1.5 !bg-emerald-50 !text-emerald-700 !border-emerald-100 font-bold shrink-0">
                                          {formatEnum(confirmedPro.specialty, confirmedPro.gender)}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 truncate">{confirmedPro.address}</p>
                                      
                                      {(confirmedPro.phone || confirmedPro.email) && (
                                        <div className="text-[11px] text-slate-600 pt-1 space-y-0.5 border-t border-slate-100 mt-1">
                                          {confirmedPro.phone && <p>Tél : <span className="text-slate-500 font-medium">{confirmedPro.phone}</span></p>}
                                          {confirmedPro.email && (confirmedPro.firstName || confirmedPro.lastName) && (
                                            <p>Email : <span className="text-slate-500 font-medium">{confirmedPro.email}</span></p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs font-bold text-slate-400 italic py-1">Aucun professionnel validé</p>
                                  )}
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
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
