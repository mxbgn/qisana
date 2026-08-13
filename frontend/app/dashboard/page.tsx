'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import SearchBar from './_components/SearchBar';
import SidebarList from './_components/SidebarList';
import TabBar, { SearchTabSnapshot } from './_components/TabBar';
import CoordinatorSettings from './_components/CoordinatorSettings';

const MapView = dynamic(() => import('./_components/MapView'), { 
  ssr: false 
});

export interface Professional {
  id: number;
  email: string;
  distance?: number;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    lat: number;
    lng: number;
    specialty: string;
    gender?: string;
    hasFormationDeces: boolean;
    hasTeleconsultation: boolean;
  };
}

export interface SearchFilters {
  specialty: 'DOCTOR' | 'NURSE' | null;
  hasFormationDeces: boolean;
}

export default function DispatchPage() {
  const [results, setResults] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centerCoords, setCenterCoords] = useState<{lat: number, lng: number, zoom?: number} | null>(null);
  const [searchMarkerCoords, setSearchMarkerCoords] = useState<{lat: number, lng: number} | null>(null);
  const [selectedProId, setSelectedProId] = useState<number | null>(null);
  const [hoveredProId, setHoveredProId] = useState<number | null>(null);
  const [confirmedProId, setConfirmedProId] = useState<number | null>(null);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<SearchTabSnapshot[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeTab = tabs.find(t => t.searchId === activeTabId) ?? null;

  useEffect(() => {
    api.get('/searches').then((res) => {
      const savedTabs = Array.isArray(res.data) ? res.data : [];
      setTabs(savedTabs);
      if (savedTabs.length > 0) {
        handleTabSelect(savedTabs[savedTabs.length - 1]);
      }
    }).catch((err) => {
      console.error('Failed to load saved searches:', err);
    });
  }, []);

  const handleTabSelect = (tab: SearchTabSnapshot) => {
    setActiveTabId(tab.searchId);
    setCurrentSearchId(tab.searchId);
    setResults(tab.results || []);
    setCenterCoords(tab.coords);
    setSearchMarkerCoords(tab.coords);
    setSelectedProId(tab.selectedProId);
    setConfirmedProId(tab.confirmedProId);
    setError((!tab.results || tab.results.length === 0) ? "no_results" : null);
  };

  const handleTabClose = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    await api.delete(`/searches/${tabId}`).catch((err) => {
      console.error('Failed to delete search snapshot:', err);
    });
    
    const remainingTabs = tabs.filter(t => t.searchId !== tabId);
    setTabs(remainingTabs);

    if (activeTabId === tabId) {
      if (remainingTabs.length > 0) {
        handleTabSelect(remainingTabs[remainingTabs.length - 1]);
      } else {
        setActiveTabId(null);
        setCurrentSearchId(null);
        setResults([]);
        setCenterCoords(null);
        setSearchMarkerCoords(null);
        setSelectedProId(null);
        setConfirmedProId(null);
        setError(null);
      }
    }
  };

  const handleSearch = async (coords: {lat: number, lng: number}, dateStr: string, address: string, filters: SearchFilters) => {
    const searchId = crypto.randomUUID();
    setCurrentSearchId(searchId);
    setLoading(true);
    setError(null);
    const newCoords = { lat: coords.lat, lng: coords.lng, zoom: 13 };
    setCenterCoords(newCoords);
    setSearchMarkerCoords(coords);
    setSelectedProId(null);
    setConfirmedProId(null);

    api.post('/audit-logs/track-search', { address, searchDate: dateStr, searchId, filters }).catch((err) => {
      console.error('Failed to log search:', err);
    });

    let filteredResults: Professional[] = [];

    try {
      const res = await api.get('/users/search-by-location', {
        params: {
          lat: coords.lat,
          lng: coords.lng,
          radius: 100,
          date: dateStr,
          specialty: filters.specialty,
          hasFormationDeces: filters.hasFormationDeces
        }
      });
      
      const freshResults = Array.isArray(res.data) ? res.data : [];

      filteredResults = freshResults.filter((pro: Professional) => {
        const isNurse = pro.profile?.specialty?.toUpperCase() === 'INFIRMIER';
        if (filters.specialty === 'NURSE' && !isNurse) return false;
        if (filters.specialty === 'DOCTOR' && isNurse) return false;

        if (filters.hasFormationDeces) {
          if (!pro.profile?.hasFormationDeces) return false;
        } else {
          if (!pro.profile?.hasTeleconsultation) return false;
        }

        return true;
      });

      setResults(filteredResults);
      if (filteredResults.length === 0) setError("no_results");
    } catch (err) {
      console.error('Search failed:', err);
      setError("no_results");
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(false);

    const newSnapshot: SearchTabSnapshot = {
      searchId,
      title: address.split(',')[0] || 'Recherche',
      address,
      searchDate: dateStr,
      coords: newCoords,
      filters,
      results: filteredResults,
      selectedProId: null,
      confirmedProId: null
    };

    try {
      await api.post('/searches', newSnapshot);
      setTabs(prev => {
        const updated = [...prev, newSnapshot];
        return updated.length > 6 ? updated.slice(1) : updated;
      });
      setActiveTabId(searchId);
    } catch (err) {
      console.error('Failed to save search snapshot:', err);
    }
  };

  const handleProClick = (pro: Professional) => {
    if (selectedProId === pro.id) return;
    setSelectedProId(pro.id);
    const nextCoords = { lat: pro.profile.lat, lng: pro.profile.lng };
    setCenterCoords(nextCoords);
    
    if (currentSearchId) {
      api.post('/audit-logs/track-click', { proId: pro.id, searchId: currentSearchId, address: pro.profile.address, status: confirmedProId === pro.id ? 'CONFIRMED' : 'NONE' }).catch((err) => {
        console.error('Failed to log click:', err);
      });
      api.patch(`/searches/${currentSearchId}`, { selectedProId: pro.id }).catch((err) => {
        console.error('Failed to update snapshot selection:', err);
      });
      setTabs(prev => prev.map(t => t.searchId === currentSearchId ? { ...t, selectedProId: pro.id, coords: nextCoords } : t));
    }
  };

  const handleInteractionResult = (proId: number, status: 'CONFIRMED') => {
    setConfirmedProId(proId);
    if (currentSearchId) {
      const pro = results.find(p => p.id === proId);
      api.post('/audit-logs/track-click', { proId, searchId: currentSearchId, address: pro?.profile?.address || '', status }).catch((err) => {
        console.error('Failed to log confirmation:', err);
      });
      api.patch(`/searches/${currentSearchId}`, { confirmedProId: proId }).catch((err) => {
        console.error('Failed to update snapshot confirmation:', err);
      });
      setTabs(prev => prev.map(t => t.searchId === currentSearchId ? { ...t, confirmedProId: proId } : t));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface-base p-4 overflow-y-auto lg:overflow-hidden font-sans">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 flex-1 lg:min-h-0">
        
        <div className="flex items-center justify-between gap-3 shrink-0 h-10 min-w-0">
          <div className="flex-1 min-w-0 h-full flex items-center">
            <TabBar 
              tabs={tabs} 
              activeTabId={activeTabId} 
              onTabSelect={handleTabSelect} 
              onTabClose={handleTabClose} 
            />
          </div>
          <CoordinatorSettings />
        </div>

        <SearchBar 
          key={activeTabId ?? 'new'}
          onSearch={handleSearch} 
          onLocationSelect={() => {}} 
          loading={loading}
          initialValues={activeTab ? {
            address: activeTab.address,
            coords: { lat: activeTab.coords.lat, lng: activeTab.coords.lng },
            dateStr: activeTab.searchDate,
            filters: activeTab.filters
          } : null}
        />
        
        <div className="flex flex-col lg:flex-row w-full flex-1 gap-4 lg:min-h-0 min-w-0">
          <SidebarList 
            results={results}
            loading={loading}
            error={error}
            selectedProId={selectedProId}
            confirmedProId={confirmedProId}
            onProClick={handleProClick}
            onProHover={setHoveredProId}
            onInteractionResult={handleInteractionResult}
          />
          <MapView 
            results={results}
            centerCoords={centerCoords}
            searchMarkerCoords={searchMarkerCoords}
            selectedProId={selectedProId}
            hoveredProId={hoveredProId}
            onProClick={handleProClick}
          />
        </div>
      </div>
    </div>
  );
}
