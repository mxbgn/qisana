'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

interface ReportFile {
  fileName: string;
  createdAt: string;
  size: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/audit-logs/reports');
      if (Array.isArray(res.data)) {
        setReports(res.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = async (fileName: string) => {
    try {
      const response = await api.get(`/audit-logs/reports/download/${fileName}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm font-bold text-slate-500 animate-pulse">Chargement...</div>;
  }

  return (
    <div className="p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rapports Mensuels Excel</h1>
      </div>
      
      <div className="qisana-card w-full overflow-hidden">
        <table className="w-full table-fixed divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th style={{ width: '40%' }} className="px-6 py-4 text-left label-title">Nom du Fichier</th>
              <th style={{ width: '25%' }} className="px-6 py-4 text-center label-title">Date de Génération</th>
              <th style={{ width: '15%' }} className="px-6 py-4 text-center label-title">Taille</th>
              <th style={{ width: '20%' }} className="px-6 py-4 text-right label-title">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                  Aucun rapport généré pour le moment
                </td>
              </tr>
            ) : (
              reports.map((file) => (
                <tr key={file.fileName} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-left text-sm font-bold text-slate-900 truncate">
                    {file.fileName}
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-bold text-slate-600 whitespace-nowrap overflow-hidden">
                    {new Date(file.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-5 text-center text-xs font-bold text-slate-400 whitespace-nowrap overflow-hidden">
                    {file.size}
                  </td>
                  <td className="px-6 py-5 text-right whitespace-nowrap overflow-hidden">
                    <button
                      onClick={() => handleDownload(file.fileName)}
                      className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Télécharger (.xlsx)</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
