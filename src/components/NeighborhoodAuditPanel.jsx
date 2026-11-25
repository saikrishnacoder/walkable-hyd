import {
  X,
  TreeDeciduous,
  Footprints,
  TrainFront,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  GitCompare,
  CheckCircle2,
  ThermometerSun,
  Ruler,
  Lightbulb,
  Calendar,
} from 'lucide-react';
import { PILLAR_META } from '../data/hyderabadWalkability';
import { computeWalkScore, getScoreTier } from '../utils/walkability';

const PILLAR_ICONS = {
  shade: TreeDeciduous,
  footpath: Footprints,
  metro: TrainFront,
  safety: ShieldCheck,
};

const SEGMENT_STYLES = {
  Walkable: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Needs Repair': 'bg-amber-50 text-amber-800 border-amber-200',
  Blocked: 'bg-red-50 text-red-800 border-red-200',
};

export default function NeighborhoodAuditPanel({
  neighborhood,
  weights,
  issues,
  isCompared,
  onToggleCompare,
  onClose,
  onReportHere,
  onSelectIssue,
}) {
  if (!neighborhood) return null;

  const score = computeWalkScore(neighborhood.metrics, weights);
  const tier = getScoreTier(score);
  const localIssues = issues.filter((i) => i.neighborhoodId === neighborhood.id);
  const openLocalIssues = localIssues.filter((i) => i.status !== 'Resolved');

  return (
    <aside
      aria-label={`Street Audit for ${neighborhood.name}`}
      className="flex h-full flex-col overflow-y-auto border-l border-black/10 bg-white"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-black/8 bg-white/95 px-5 py-4 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F7F5F0] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#525866]">
              {neighborhood.zone}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tier.badgeClass}`}>
              Grade {tier.grade} · {tier.label}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-extrabold leading-tight text-[#181D23]">
            {neighborhood.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close neighborhood audit"
          className="rounded-lg p-1.5 text-[#525866] hover:bg-black/5 hover:text-[#181D23]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 p-5">
        {/* Hero Score + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/8 bg-[#F7F5F0] p-4">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: tier.color }}
            >
              <span className="font-mono-num text-2xl font-extrabold leading-none">{score}</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-90">
                / 100
              </span>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#525866]">
                Weighted Walk Score
              </div>
              <p className="mt-0.5 text-xs text-[#3F4654]">
                {openLocalIssues.length} active civic {openLocalIssues.length === 1 ? 'issue' : 'issues'} logged
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onToggleCompare(neighborhood.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isCompared
                  ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white'
                  : 'border-black/12 bg-white text-[#181D23] hover:bg-black/5'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {isCompared ? 'In Compare' : 'Compare'}
            </button>
            <button
              type="button"
              onClick={() => onReportHere(neighborhood)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D96B27] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#C25C1D]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Report Issue Here
            </button>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm leading-relaxed text-[#3F4654]">{neighborhood.summary}</p>

        {/* 4-Pillar Breakdown */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">
            4-Pillar Street Audit Breakdown
          </h3>
          <div className="mt-2.5 space-y-3">
            {PILLAR_META.map((p) => {
              const Icon = PILLAR_ICONS[p.key];
              const val = neighborhood.metrics[p.key];
              return (
                <div key={p.key} className="rounded-xl border border-black/8 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: p.color }} />
                      <span className="text-xs font-bold text-[#181D23]">{p.label}</span>
                    </div>
                    <span className="font-mono-num text-sm font-extrabold text-[#181D23]">
                      {val}
                      <span className="text-[11px] font-medium text-[#525866]">/100</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EFECE5]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${val}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#525866]">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Field Telemetry Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">
            Street-Audit Telemetry
          </h3>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-black/8 bg-[#FAF9F6] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#525866]">
                <Footprints className="h-3.5 w-3.5 text-[#D96B27]" />
                Footpath Continuity
              </div>
              <div className="font-mono-num mt-1 text-base font-bold text-[#181D23]">
                {neighborhood.audit.sidewalkContinuityPct}%
              </div>
              <div className="text-[11px] text-[#525866]">
                Avg width {neighborhood.audit.avgFootpathWidthM}m
              </div>
            </div>

            <div className="rounded-xl border border-black/8 bg-[#FAF9F6] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#525866]">
                <ThermometerSun className="h-3.5 w-3.5 text-[#1F7A4C]" />
                Canopy & Heat Delta
              </div>
              <div className="font-mono-num mt-1 text-base font-bold text-[#181D23]">
                {neighborhood.audit.canopyCoveragePct}% cover
              </div>
              <div className="text-[11px] text-[#525866]">
                {neighborhood.audit.heatIslandDeltaC > 0
                  ? `+${neighborhood.audit.heatIslandDeltaC}°C vs baseline`
                  : `${neighborhood.audit.heatIslandDeltaC}°C cooler`}
              </div>
            </div>

            <div className="rounded-xl border border-black/8 bg-[#FAF9F6] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#525866]">
                <TrainFront className="h-3.5 w-3.5 text-[#0E7C7B]" />
                Nearest Metro
              </div>
              <div className="font-mono-num mt-1 text-base font-bold text-[#181D23]">
                {neighborhood.audit.metroWalkMins} min walk
              </div>
              <div className="truncate text-[11px] text-[#525866]" title={neighborhood.audit.nearestMetro}>
                {neighborhood.audit.nearestMetro}
              </div>
            </div>

            <div className="rounded-xl border border-black/8 bg-[#FAF9F6] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#525866]">
                <Lightbulb className="h-3.5 w-3.5 text-[#3B5BDB]" />
                Lighting & Crossings
              </div>
              <div className="font-mono-num mt-1 text-base font-bold text-[#181D23]">
                {neighborhood.audit.streetlightsPerKm}/km
              </div>
              <div className="text-[11px] text-[#525866]">
                {neighborhood.audit.crosswalkCount} marked crossings
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#525866]">
            <Calendar className="h-3.5 w-3.5" />
            Last citizen field audit: {neighborhood.audit.lastAuditDate}
          </div>
        </div>

        {/* Audited Street Corridors */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">
            Audited Street Corridors
          </h3>
          <div className="mt-2.5 space-y-2">
            {neighborhood.segments.map((seg) => (
              <div
                key={seg.name}
                className="rounded-xl border border-black/8 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#181D23]">{seg.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#525866]">
                      <Ruler className="h-3 w-3" /> {seg.lengthKm} km corridor
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      SEGMENT_STYLES[seg.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {seg.status}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#3F4654]">{seg.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Bottlenecks */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              What Works
            </div>
            <ul className="mt-2 space-y-1 text-xs text-emerald-950">
              {neighborhood.highlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-orange-200/70 bg-orange-50/50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
              <AlertTriangle className="h-4 w-4 text-[#D96B27]" />
              Friction Points
            </div>
            <ul className="mt-2 space-y-1 text-xs text-orange-950">
              {neighborhood.painPoints.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Local Issues */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">
            Community Issues in This Area ({localIssues.length})
          </h3>
          {localIssues.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-black/15 p-3 text-xs text-[#525866]">
              No pedestrian issues reported here yet.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {localIssues.map((iss) => (
                <button
                  key={iss.id}
                  type="button"
                  onClick={() => onSelectIssue(iss.id)}
                  className="w-full rounded-xl border border-black/8 bg-[#FAF9F6] p-3 text-left transition hover:border-black/20 hover:bg-[#F2EFE8]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#181D23]">{iss.title}</span>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#3F4654] ring-1 ring-black/10">
                      {iss.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#525866]">
                    <span>{iss.street}</span>
                    <span className="font-mono-num font-semibold">▲ {iss.upvotes}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
