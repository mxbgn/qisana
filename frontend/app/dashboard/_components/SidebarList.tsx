import { Professional } from '../page';

interface SidebarListProps { 
  results: Professional[]; 
  loading: boolean; 
  error: string | null;
  selectedProId: number | null;
  confirmedProId: number | null;
  onProClick: (pro: Professional) => void;
  onProHover: (id: number | null) => void;
  onInteractionResult?: (proId: number, status: 'CONFIRMED') => void;
}

export default function SidebarList({ 
  results, 
  loading, 
  error, 
  selectedProId, 
  confirmedProId,
  onProClick, 
  onProHover,
  onInteractionResult 
}: SidebarListProps) {

  const hasNameInfo = (pro: Professional) => {
    return !!(pro.profile?.firstName || pro.profile?.lastName);
  };

  const formatEnum = (val: string | null, gender?: string | null) => {
    if (!val) return 'Généraliste';
    
    const normalizedSpec = val.toUpperCase();
    const normalizedGender = gender?.toUpperCase();

    if (normalizedSpec === 'INFIRMIER' && normalizedGender === 'FEMALE') {
      return 'Infirmière';
    }

    return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const getPrefix = (pro: Professional) => {
    const isNurse = pro.profile?.specialty?.toUpperCase() === 'INFIRMIER';
    if (!isNurse) {
      return 'Dr ';
    }
    if (pro.profile?.gender === 'MALE') return 'Mr ';
    if (pro.profile?.gender === 'FEMALE') return 'Mme ';
    return '';
  };

  const handleInteraction = (e: React.MouseEvent, proId: number) => {
    e.stopPropagation();
    if (onInteractionResult) onInteractionResult(proId, 'CONFIRMED');
  };

  return (
    <aside className="w-full h-auto max-h-[480px] min-h-0 shrink-0 lg:w-[450px] lg:h-auto lg:max-h-none lg:flex-none flex flex-col qisana-card font-sans">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-surface-base flex flex-col">
        {loading ? (
          <div className="w-full animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-brand-ice" />)}
          </div>
        ) : (results.length === 0 || error) ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center py-8 lg:py-0 px-6 text-surface-muted italic">
            <p className="text-sm font-medium">
              {error === "no_results" ? "Aucun professionnel disponible pour cette recherche" : "En attente de recherche"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 auto-rows-min">
            {results.map((pro) => {
              const isConfirmed = confirmedProId === pro.id;

              return (
                <div 
                  key={pro.id} 
                  onClick={() => onProClick(pro)}
                  onMouseEnter={() => onProHover(pro.id)}
                  onMouseLeave={() => onProHover(null)}
                  className={`w-full p-4 border transition-all duration-200 cursor-pointer group rounded-xl ${
                    selectedProId === pro.id 
                      ? 'bg-brand-ice/20 border-brand-ice ring-1 ring-brand-ice' 
                      : 'bg-white border-brand-ice/60 hover:border-brand-ice hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`qisana-pill ${
                      selectedProId === pro.id ? 'bg-brand-navy text-white border-transparent' : 'bg-brand-ice/40 text-brand-navy border-brand-ice'
                    }`}>
                      {formatEnum(pro.profile?.specialty, pro.profile?.gender)}
                    </span>
                    {pro.distance !== undefined && (
                      <span className={`text-xs font-bold tracking-tight transition-colors whitespace-nowrap ${
                        selectedProId === pro.id ? 'text-brand-navy' : 'text-surface-muted group-hover:text-brand-navy/70'
                      }`}>
                        {pro.distance.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  
                  {hasNameInfo(pro) ? (
                    <span className={`flex flex-wrap items-baseline text-base font-bold tracking-tight transition-colors gap-x-1.5 min-w-0 max-w-full ${
                      selectedProId === pro.id ? 'text-brand-navy font-black' : 'text-brand-navy group-hover:text-brand-navy/80'
                    }`}>
                      <span className="truncate max-w-full block">
                        {getPrefix(pro)}
                        {pro.profile?.firstName}
                      </span>
                      
                      <span className="truncate max-w-full block">
                        {pro.profile?.lastName}
                      </span>
                    </span>
                  ) : (
                    <p className={`text-base font-bold tracking-tight transition-colors truncate ${selectedProId === pro.id ? 'text-brand-navy font-black' : 'text-brand-navy group-hover:text-brand-navy/80'}`}>
                      {pro.email}
                    </p>
                  )} 
                  <p className={`text-xs mt-0.5 font-medium truncate ${selectedProId === pro.id ? 'text-brand-navy' : 'text-surface-muted'}`}>
                    {pro.profile?.address}
                  </p>

                  {(pro.profile?.hasFormationDeces || pro.profile?.hasTeleconsultation) && (
                    <div className="flex gap-1.5 flex-wrap mt-3">
                      {pro.profile?.hasFormationDeces && (
                        <span className="qisana-pill !py-1 !px-3 bg-brand-ice/30 text-brand-navy border-brand-ice">
                          Certificat décès
                        </span>
                      )}
                      {pro.profile?.hasTeleconsultation && (
                        <span className="qisana-pill !py-1 !px-3 bg-brand-ice/30 text-brand-navy border-brand-ice">
                          Téléconsultation
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${selectedProId === pro.id ? 'grid-rows-[1fr] mt-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="flex flex-col gap-3 min-h-0 border-t border-brand-ice pt-4">
                      
                      {pro.profile?.phone && (
                        <div className="flex items-center justify-center gap-2 text-sm font-bold text-brand-navy bg-white border border-brand-ice rounded-xl py-2">
                          <svg className="w-4 h-4 text-surface-muted inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{pro.profile.phone}</span>
                        </div>
                      )}

                      <div className="flex mt-1">
                        <button
                          onClick={(e) => handleInteraction(e, pro.id)}
                          className={`w-full qisana-btn !h-9 !px-3 !text-sm !shadow-none border ${
                            isConfirmed
                              ? 'qisana-btn-success'
                              : '!bg-white !border-brand-ice !text-brand-navy hover:!border-success-main hover:!text-success-main hover:!bg-success-bg'
                          }`}
                        >
                          {isConfirmed ? 'Confirmé' : 'Confirmer'}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
