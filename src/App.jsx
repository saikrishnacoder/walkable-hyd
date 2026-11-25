import { useEffect, useMemo, useState } from 'react';
import {
  Footprints,
  Map as MapIcon,
  Compass,
  AlertTriangle,
  GitCompare,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  INITIAL_ISSUES,
  NEIGHBORHOODS,
  WEIGHT_PRESETS,
} from './data/hyderabadWalkability';
import { computeWalkScore } from './utils/walkability';
import HyderabadMap from './components/HyderabadMap';
import WeightControls from './components/WeightControls';
import NeighborhoodExplorer from './components/NeighborhoodExplorer';
import NeighborhoodAuditPanel from './components/NeighborhoodAuditPanel';
import ComparePanel from './components/ComparePanel';
import IssueFeedPanel from './components/IssueFeedPanel';
import IssueReporterModal from './components/IssueReporterModal';

const STORAGE_KEYS = {
  issues: 'walkable_hyd_issues_v1',
  upvotes: 'walkable_hyd_upvotes_v1',
  weights: 'walkable_hyd_weights_v1',
  preset: 'walkable_hyd_preset_v1',
};

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'issues' | 'compare'
  const [mobileView, setMobileView] = useState('split'); // 'panel' | 'map' on small screens
  const [weights, setWeights] = useState(() =>
    readJsonStorage(STORAGE_KEYS.weights, WEIGHT_PRESETS[0].weights)
  );
  const [activePresetId, setActivePresetId] = useState(() =>
    readJsonStorage(STORAGE_KEYS.preset, WEIGHT_PRESETS[0].id)
  );
  const [weightsExpanded, setWeightsExpanded] = useState(false);

  const [issues, setIssues] = useState(() =>
    readJsonStorage(STORAGE_KEYS.issues, INITIAL_ISSUES)
  );
  const [upvotedIds, setUpvotedIds] = useState(() =>
    readJsonStorage(STORAGE_KEYS.upvotes, [])
  );

  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState('jubilee-kbr');
  const [auditOpen, setAuditOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [compareIds, setCompareIds] = useState(['jubilee-kbr', 'hitec-durgam']);

  const [layers, setLayers] = useState({
    zones: true,
    issues: true,
    metro: true,
  });

  const [isReporterOpen, setIsReporterOpen] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [draftCoords, setDraftCoords] = useState(null);
  const [toast, setToast] = useState('');

  // Persist user state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.issues, JSON.stringify(issues));
    } catch {
      // ignore storage quota errors
    }
  }, [issues]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.upvotes, JSON.stringify(upvotedIds));
    } catch {
      // ignore
    }
  }, [upvotedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(weights));
      localStorage.setItem(STORAGE_KEYS.preset, JSON.stringify(activePresetId));
    } catch {
      // ignore
    }
  }, [weights, activePresetId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const citySummary = useMemo(() => {
    const scores = NEIGHBORHOODS.map((n) => computeWalkScore(n.metrics, weights));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const openIssues = issues.filter((i) => i.status !== 'Resolved').length;
    const resolvedIssues = issues.filter((i) => i.status === 'Resolved').length;
    return { avgScore, openIssues, resolvedIssues };
  }, [weights, issues]);

  const selectedNeighborhood = useMemo(
    () => NEIGHBORHOODS.find((n) => n.id === selectedNeighborhoodId) || null,
    [selectedNeighborhoodId]
  );

  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setWeights(preset.weights);
  };

  const handleChangeWeight = (key, value) => {
    setActivePresetId('custom');
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectNeighborhood = (id) => {
    setSelectedNeighborhoodId(id);
    setSelectedIssueId(null);
    setAuditOpen(true);
  };

  const handleSelectIssue = (id) => {
    setSelectedIssueId(id);
    setActiveTab('issues');
    setLayers((prev) => ({ ...prev, issues: true }));
    if (window.innerWidth < 1024) {
      setMobileView('map');
    }
  };

  const handleToggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleSelectCompareSlot = (slotIdx, id) => {
    setCompareIds((prev) => {
      const next = [...prev];
      next[slotIdx] = id;
      return next;
    });
  };

  const handleToggleUpvote = (id) => {
    const already = upvotedIds.includes(id);
    setUpvotedIds((prev) =>
      already ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setIssues((prev) =>
      prev.map((iss) =>
        iss.id === id
          ? { ...iss, upvotes: Math.max(0, iss.upvotes + (already ? -1 : 1)) }
          : iss
      )
    );
  };

  const handleChangeStatus = (id, status) => {
    setIssues((prev) =>
      prev.map((iss) => (iss.id === id ? { ...iss, status } : iss))
    );
    setToast(`Updated status to "${status}"`);
  };

  const handleOpenReporter = (neighborhood = null) => {
    const target = neighborhood || selectedNeighborhood || NEIGHBORHOODS[0];
    setDraftCoords({ lat: target.lat, lng: target.lng });
    setIsPickingLocation(false);
    setIsReporterOpen(true);
  };

  const handleStartPickLocation = (active) => {
    setIsPickingLocation(active);
    if (active && window.innerWidth < 1024) {
      setMobileView('map');
    }
  };

  const handlePickLocation = (lat, lng) => {
    setDraftCoords({ lat, lng });
  };

  const handleSubmitIssue = (payload) => {
    const newIssue = {
      id: `iss-${Date.now()}`,
      ...payload,
      status: 'Reported',
      upvotes: 1,
      createdAt: new Date().toISOString(),
    };
    setIssues((prev) => [newIssue, ...prev]);
    setUpvotedIds((prev) => [...prev, newIssue.id]);
    setIsReporterOpen(false);
    setIsPickingLocation(false);
    setDraftCoords(null);
    setActiveTab('issues');
    setLayers((prev) => ({ ...prev, issues: true }));
    setSelectedIssueId(newIssue.id);
    setToast('New pedestrian issue pinned on the Hyderabad map!');
  };

  const handleResetDemo = () => {
    setIssues(INITIAL_ISSUES);
    setUpvotedIds([]);
    setWeights(WEIGHT_PRESETS[0].weights);
    setActivePresetId(WEIGHT_PRESETS[0].id);
    setToast('Demo data restored to default Hyderabad audit.');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F5F0] text-[#181D23]">
      {/* Top Civic Header */}
      <header className="z-30 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-2.5 shadow-2xs sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#181D23] text-white shadow-sm">
            <Footprints className="h-5 w-5 text-[#F39C6B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base font-extrabold tracking-tight text-[#181D23] sm:text-lg">
                Walkable HYD
              </h1>
              <span className="hidden rounded-full bg-[#E6F4F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0E7C7B] sm:inline-block">
                Hyderabad Urban Atlas
              </span>
            </div>
            <p className="hidden text-[11px] text-[#525866] sm:block">
              Street-audit walkability explorer &amp; community pedestrian issue map
            </p>
          </div>
        </div>

        {/* City Telemetry Strip */}
        <div className="hidden items-center gap-4 xl:flex">
          <div className="flex items-center gap-2 rounded-xl bg-[#F7F5F0] px-3 py-1.5 text-xs">
            <span className="text-[#525866]">City Avg Score</span>
            <span className="font-mono-num font-extrabold text-[#181D23]">
              {citySummary.avgScore}/100
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#F7F5F0] px-3 py-1.5 text-xs">
            <span className="text-[#525866]">Open Hazards</span>
            <span className="font-mono-num font-extrabold text-[#D96B27]">
              {citySummary.openIssues}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#F7F5F0] px-3 py-1.5 text-xs">
            <span className="text-[#525866]">Resolved</span>
            <span className="font-mono-num font-extrabold text-[#1F7A4C]">
              {citySummary.resolvedIssues}
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDemo}
            title="Reset saved reports and weights"
            className="hidden items-center gap-1 rounded-xl border border-black/12 bg-white px-2.5 py-2 text-xs font-semibold text-[#525866] hover:bg-[#F7F5F0] hover:text-[#181D23] sm:inline-flex"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => handleOpenReporter(selectedNeighborhood)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D96B27] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#C25C1D]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Report Issue</span>
          </button>
        </div>
      </header>

      {/* Mobile View Switcher */}
      <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-2 lg:hidden">
        <div className="flex gap-1 rounded-xl bg-[#F7F5F0] p-1">
          <button
            type="button"
            onClick={() => setMobileView('panel')}
            className={`rounded-lg px-3 py-1 text-xs font-bold ${
              mobileView !== 'map' ? 'bg-white text-[#181D23] shadow-xs' : 'text-[#525866]'
            }`}
          >
            Audits &amp; Feed
          </button>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${
              mobileView === 'map' ? 'bg-white text-[#181D23] shadow-xs' : 'text-[#525866]'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Live Map
          </button>
        </div>
        <span className="font-mono-num text-xs font-bold text-[#0E7C7B]">
          Avg {citySummary.avgScore}/100
        </span>
      </div>

      {/* Main Split Workspace */}
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Left Navigation & List Workspace */}
        <section
          aria-label="Walkability Explorer and Civic Feed"
          className={`${
            mobileView === 'map' ? 'hidden' : 'flex'
          } w-full shrink-0 flex-col border-r border-black/10 bg-[#F7F5F0] lg:flex lg:w-[420px]`}
        >
          {/* Navigation Tabs */}
          <nav
            aria-label="Workspace Sections"
            className="grid grid-cols-3 gap-1 border-b border-black/8 bg-white px-3 py-2"
          >
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === 'explorer'
                  ? 'bg-[#181D23] text-white'
                  : 'text-[#525866] hover:bg-[#F7F5F0]'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Neighborhoods
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === 'issues'
                  ? 'bg-[#D96B27] text-white'
                  : 'text-[#525866] hover:bg-[#F7F5F0]'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Issues ({citySummary.openIssues})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === 'compare'
                  ? 'bg-[#0B5E5D] text-white shadow-xs'
                  : 'text-[#525866] hover:bg-[#F7F5F0]'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </button>
          </nav>

          {/* Scrollable Body */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
            {activeTab !== 'issues' && (
              <WeightControls
                weights={weights}
                activePresetId={activePresetId}
                onSelectPreset={handleSelectPreset}
                onChangeWeight={handleChangeWeight}
                isExpanded={weightsExpanded}
                onToggleExpand={() => setWeightsExpanded((v) => !v)}
              />
            )}

            {activeTab === 'explorer' && (
              <NeighborhoodExplorer
                neighborhoods={NEIGHBORHOODS}
                weights={weights}
                issues={issues}
                selectedNeighborhoodId={selectedNeighborhoodId}
                onSelectNeighborhood={handleSelectNeighborhood}
                compareIds={compareIds}
                onToggleCompare={handleToggleCompare}
              />
            )}

            {activeTab === 'issues' && (
              <IssueFeedPanel
                issues={issues}
                neighborhoods={NEIGHBORHOODS}
                upvotedIds={upvotedIds}
                selectedIssueId={selectedIssueId}
                onSelectIssue={handleSelectIssue}
                onToggleUpvote={handleToggleUpvote}
                onChangeStatus={handleChangeStatus}
                onOpenReporter={() => handleOpenReporter(selectedNeighborhood)}
              />
            )}

            {activeTab === 'compare' && (
              <ComparePanel
                neighborhoods={NEIGHBORHOODS}
                compareIds={compareIds}
                weights={weights}
                onSelectCompareSlot={handleSelectCompareSlot}
                onRemoveCompare={handleToggleCompare}
                onSelectNeighborhood={handleSelectNeighborhood}
              />
            )}
          </div>
        </section>

        {/* Interactive Hyderabad Map Canvas */}
        <section
          className={`${
            mobileView === 'map' ? 'block' : 'hidden'
          } relative min-w-0 flex-1 lg:block`}
        >
          <HyderabadMap
            neighborhoods={NEIGHBORHOODS}
            weights={weights}
            selectedNeighborhoodId={selectedNeighborhoodId}
            onSelectNeighborhood={handleSelectNeighborhood}
            issues={issues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={handleSelectIssue}
            layers={layers}
            onToggleLayer={(key) =>
              setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            isPickingLocation={isPickingLocation}
            draftCoords={draftCoords}
            onPickLocation={handlePickLocation}
            onCancelPick={() => setIsPickingLocation(false)}
          />
        </section>

        {/* Slide-Over Street Audit Panel */}
        {auditOpen && selectedNeighborhood && (
          <div className="absolute inset-y-0 right-0 z-[950] w-full max-w-md shadow-2xl">
            <NeighborhoodAuditPanel
              neighborhood={selectedNeighborhood}
              weights={weights}
              issues={issues}
              isCompared={compareIds.includes(selectedNeighborhood.id)}
              onToggleCompare={handleToggleCompare}
              onClose={() => setAuditOpen(false)}
              onReportHere={(n) => handleOpenReporter(n)}
              onSelectIssue={(id) => {
                setAuditOpen(false);
                handleSelectIssue(id);
              }}
            />
          </div>
        )}
      </main>

      {/* Issue Reporter Modal */}
      <IssueReporterModal
        isOpen={isReporterOpen}
        neighborhoods={NEIGHBORHOODS}
        draftCoords={draftCoords}
        isPickingLocation={isPickingLocation}
        onStartPickLocation={handleStartPickLocation}
        onSetDraftCoords={setDraftCoords}
        onClose={() => {
          setIsReporterOpen(false);
          setIsPickingLocation(false);
          setDraftCoords(null);
        }}
        onSubmitIssue={handleSubmitIssue}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[1200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#181D23] px-4 py-2 text-xs font-semibold text-white shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
