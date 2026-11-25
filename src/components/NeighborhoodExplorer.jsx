import { useMemo, useState } from 'react';
import {
  Search,
  TreeDeciduous,
  Footprints,
  TrainFront,
  ShieldCheck,
  GitCompare,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { computeWalkScore, getScoreTier } from '../utils/walkability';

export default function NeighborhoodExplorer({
  neighborhoods,
  weights,
  issues,
  selectedNeighborhoodId,
  onSelectNeighborhood,
  compareIds,
  onToggleCompare,
}) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [zoneFilter, setZoneFilter] = useState('all');

  const zones = useMemo(
    () => ['all', ...Array.from(new Set(neighborhoods.map((n) => n.zone)))],
    [neighborhoods]
  );

  const openCountByNeighborhood = useMemo(() => {
    const counts = {};
    for (const iss of issues) {
      if (iss.status !== 'Resolved') {
        counts[iss.neighborhoodId] = (counts[iss.neighborhoodId] || 0) + 1;
      }
    }
    return counts;
  }, [issues]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    return neighborhoods
      .map((n) => ({
        ...n,
        score: computeWalkScore(n.metrics, weights),
        openIssues: openCountByNeighborhood[n.id] || 0,
      }))
      .filter((n) => {
        if (zoneFilter !== 'all' && n.zone !== zoneFilter) return false;
        if (!q) return true;
        return (
          n.name.toLowerCase().includes(q) ||
          n.zone.toLowerCase().includes(q) ||
          n.audit.nearestMetro.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'shade') return b.metrics.shade - a.metrics.shade;
        if (sortBy === 'footpath') return b.metrics.footpath - a.metrics.footpath;
        if (sortBy === 'metro') return b.metrics.metro - a.metrics.metro;
        if (sortBy === 'issues') return b.openIssues - a.openIssues;
        return b.score - a.score;
      });
  }, [neighborhoods, weights, query, zoneFilter, sortBy, openCountByNeighborhood]);

  return (
    <div className="space-y-3">
      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#525866]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Jubilee Hills, Metro, Charminar..."
            aria-label="Search Hyderabad neighborhoods"
            className="w-full rounded-xl border border-black/12 bg-white py-2 pr-3 pl-9 text-xs text-[#181D23] placeholder:text-[#7B8291] focus:border-[#0E7C7B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            aria-label="Filter by Hyderabad zone"
            className="flex-1 rounded-xl border border-black/12 bg-white px-2.5 py-1.5 text-xs font-medium text-[#181D23]"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === 'all' ? 'All Zones (10)' : z}
              </option>
            ))}
          </select>

          <div className="relative flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#525866]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort neighborhoods"
              className="rounded-xl border border-black/12 bg-white py-1.5 pr-2.5 pl-7 text-xs font-medium text-[#181D23]"
            >
              <option value="score">Sort: Walk Score</option>
              <option value="shade">Sort: Best Shade</option>
              <option value="footpath">Sort: Best Footpaths</option>
              <option value="metro">Sort: Metro Access</option>
              <option value="issues">Sort: Most Open Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Neighborhood Cards */}
      <div className="space-y-2.5">
        {ranked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-xs text-[#525866]">
            No Hyderabad neighborhoods matched "{query}".
          </div>
        ) : (
          ranked.map((n, idx) => {
            const tier = getScoreTier(n.score);
            const isSelected = n.id === selectedNeighborhoodId;
            const isCompared = compareIds.includes(n.id);

            return (
              <article
                key={n.id}
                className={`group rounded-2xl border bg-white p-3.5 transition ${
                  isSelected
                    ? 'border-[#181D23] ring-2 ring-[#181D23]/12 shadow-md'
                    : 'border-black/10 hover:border-black/25 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectNeighborhood(n.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#525866]">
                      <span className="font-mono-num text-[#D96B27]">#{idx + 1}</span>
                      <span>·</span>
                      <span>{n.zone}</span>
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-[#181D23] group-hover:text-[#0E7C7B]">
                      {n.name}
                    </h3>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectNeighborhood(n.id)}
                    aria-label={`${n.name} weighted score ${n.score}`}
                    className="flex shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-white shadow-xs"
                    style={{ backgroundColor: tier.color }}
                  >
                    <span className="font-mono-num text-base font-extrabold leading-none">
                      {n.score}
                    </span>
                    <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-90">
                      {tier.grade}
                    </span>
                  </button>
                </div>

                {/* 4 Pillar Mini Metrics */}
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  <div className="rounded-lg bg-[#F7F5F0] px-2 py-1.5" title="Tree Canopy & Shade">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#525866]">
                      <TreeDeciduous className="h-3 w-3 text-[#1F7A4C]" />
                      Shade
                    </div>
                    <div className="font-mono-num mt-0.5 text-xs font-bold text-[#181D23]">
                      {n.metrics.shade}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#F7F5F0] px-2 py-1.5" title="Footpath Quality">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#525866]">
                      <Footprints className="h-3 w-3 text-[#D96B27]" />
                      Path
                    </div>
                    <div className="font-mono-num mt-0.5 text-xs font-bold text-[#181D23]">
                      {n.metrics.footpath}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#F7F5F0] px-2 py-1.5" title="Metro & Transit Reach">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#525866]">
                      <TrainFront className="h-3 w-3 text-[#0E7C7B]" />
                      Metro
                    </div>
                    <div className="font-mono-num mt-0.5 text-xs font-bold text-[#181D23]">
                      {n.metrics.metro}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#F7F5F0] px-2 py-1.5" title="Lighting & Crossing Safety">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#525866]">
                      <ShieldCheck className="h-3 w-3 text-[#3B5BDB]" />
                      Safe
                    </div>
                    <div className="font-mono-num mt-0.5 text-xs font-bold text-[#181D23]">
                      {n.metrics.safety}
                    </div>
                  </div>
                </div>

                {/* Footer Row */}
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/6 pt-2 text-[11px]">
                  <span className="flex items-center gap-1 text-[#525866]">
                    <AlertCircle className="h-3.5 w-3.5 text-[#D96B27]" />
                    <strong className="font-mono-num text-[#181D23]">{n.openIssues}</strong> open{' '}
                    {n.openIssues === 1 ? 'issue' : 'issues'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleCompare(n.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-semibold transition ${
                        isCompared
                          ? 'bg-[#0E7C7B] text-white'
                          : 'text-[#525866] hover:bg-black/5 hover:text-[#181D23]'
                      }`}
                    >
                      <GitCompare className="h-3 w-3" />
                      {isCompared ? 'Comparing' : 'Compare'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectNeighborhood(n.id)}
                      className="font-bold text-[#0E7C7B] hover:underline"
                    >
                      Inspect audit →
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
