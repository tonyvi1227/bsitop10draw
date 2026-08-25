import React, { useState } from 'react';
import { BsiItem, BsiReportMetadata, CategoryType } from './types/bsi';
import { SAMPLE_DATA } from './utils/sampleData';
import { DataStudio } from './components/studio/DataStudio';
import { ChartCanvas } from './components/canvas/ChartCanvas';
import { ControlSidebar } from './components/sidebar/ControlSidebar';
import { QCStudio } from './components/studio/QCStudio';
import { UserGuide } from './components/studio/UserGuide';
import { Database, Sparkles, ShieldCheck, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [mainMode, setMainMode] = useState<'DATA_STUDIO' | 'GRAPHIC_STUDIO' | 'QC_STUDIO' | 'GUIDE'>('DATA_STUDIO');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const [metadata, setMetadata] = useState<BsiReportMetadata>({
    category: 'CAMPAIGNS',
    format: 'CHART',
    month: '06',
    year: '2026',
    canvasResolution: '1920x1080',
    highDpiScale: 2,
  });

  // Store data for all 4 categories (CAMPAIGNS, EVENTS, SHOWS, INFLUENCERS)
  const [categoryDataStore, setCategoryDataStore] = useState<Record<CategoryType, BsiItem[]>>({
    CAMPAIGNS: SAMPLE_DATA.CAMPAIGNS,
    EVENTS: SAMPLE_DATA.EVENTS,
    SHOWS: SAMPLE_DATA.SHOWS,
    INFLUENCERS: SAMPLE_DATA.INFLUENCERS,
  });

  const activeItems = categoryDataStore[metadata.category] || [];

  const handleSetActiveItems: React.Dispatch<React.SetStateAction<BsiItem[]>> = (action) => {
    setCategoryDataStore((prevStore) => {
      const activeCat = metadata.category;
      const prevItems = prevStore[activeCat] || [];
      const nextItems = typeof action === 'function' ? action(prevItems) : action;
      return {
        ...prevStore,
        [activeCat]: nextItems,
      };
    });
  };

  const handleBulkUpdateAllCategories = (dataMap: Partial<Record<CategoryType, BsiItem[]>>) => {
    setCategoryDataStore((prevStore) => ({
      ...prevStore,
      ...dataMap,
    }));
  };

  const handleLoadSampleData = (category: CategoryType) => {
    setCategoryDataStore((prevStore) => ({
      ...prevStore,
      [category]: SAMPLE_DATA[category] || [],
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased select-none">
      {/* App Top Navigation Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-buzz-orange to-buzz-lightOrange flex items-center justify-center shadow-lg shadow-buzz-orange/30">
            <span className="font-extrabold text-white text-base tracking-wider">BSI</span>
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight">Buzzmetrics BSI Top10 Studio</h1>
            <p className="text-[10px] text-slate-400 font-medium">Graphic & Live Data Automation System</p>
          </div>
        </div>

        {/* Studio Mode Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setMainMode('DATA_STUDIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainMode === 'DATA_STUDIO'
                ? 'bg-buzz-orange text-white shadow-md shadow-buzz-orange/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Nhập Liệu Data</span>
          </button>

          <button
            onClick={() => setMainMode('GRAPHIC_STUDIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainMode === 'GRAPHIC_STUDIO'
                ? 'bg-buzz-orange text-white shadow-md shadow-buzz-orange/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Graphic Studio</span>
          </button>

          <button
            onClick={() => setMainMode('QC_STUDIO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainMode === 'QC_STUDIO'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. QC và Xuất Ảnh</span>
          </button>

          <button
            onClick={() => setMainMode('GUIDE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainMode === 'GUIDE'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>4. Hướng Dẫn</span>
          </button>
        </div>
      </header>

      {/* Main Studio View Container */}
      <main className="flex-1 overflow-hidden relative">
        {mainMode === 'DATA_STUDIO' ? (
          <DataStudio
            metadata={metadata}
            setMetadata={setMetadata}
            categoryDataStore={categoryDataStore}
            setCategoryDataStore={setCategoryDataStore}
            onNavigateToGraphic={() => setMainMode('GRAPHIC_STUDIO')}
          />
        ) : mainMode === 'GRAPHIC_STUDIO' ? (
          <div className="flex h-full w-full overflow-hidden relative">
            {/* Collapsible Control Sidebar */}
            {isSidebarOpen && (
              <ControlSidebar
                metadata={metadata}
                setMetadata={setMetadata}
                items={activeItems}
                setItems={handleSetActiveItems}
                onLoadSampleData={handleLoadSampleData}
                onBulkUpdateAllCategories={handleBulkUpdateAllCategories}
                onlyTop10Edit={true}
              />
            )}

            {/* Main Canvas Graphic Studio */}
            <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden relative">
              <ChartCanvas
                items={activeItems}
                metadata={metadata}
                setMetadata={setMetadata}
                categoryDataStore={categoryDataStore}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              />
            </div>
          </div>
        ) : mainMode === 'QC_STUDIO' ? (
          <QCStudio
            items={activeItems}
            allCategoryItems={categoryDataStore}
            metadata={metadata}
            templateAssets={{}}
            onSelectCategory={(cat) => setMetadata((prev) => ({ ...prev, category: cat }))}
            onSelectFormat={(fmt) => setMetadata((prev) => ({ ...prev, format: fmt }))}
          />
        ) : (
          <UserGuide onNavigateToTab={(tab) => setMainMode(tab)} />
        )}
      </main>
    </div>
  );
};

export default App;
