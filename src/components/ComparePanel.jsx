import { GitCompare, X, Check } from 'lucide-react';
import { PILLAR_META } from '../data/hyderabadWalkability';
import { computeWalkScore, getScoreTier } from '../utils/walkability';

export default function ComparePanel({
  neighborhoods,
  compareIds,
  weights,
  onSelectCompareSlot,
  onRemoveCompare,
  onSelectNeighborhood,
}) {
  const first = neighborhoods.find((n) => n.id === compareIds[0]) || neighborhoods[0];
  const second = neighborhoods.find((n) => n.id === compareIds[1]) || neighborhoods[1];

  const scoreA = computeWalkScore(first.metrics, weights);
  const scoreB = computeWalkScore(second.metrics, weights);
  const tierA = getScoreTier(scoreA);
  const tierB = getScoreTier(scoreB);

  const telemetryRows = [
    {
      label: 'Footpath Continuity',
      valA: `${first.audit.sidewalkContinuityPct}%`,
      valB: `${second.audit.sidewalkContinuityPct}%`,
      winA: first.audit.sidewalkContinuityPct >= second.audit.sidewalkContinuityPct,
    },
    {
      label: 'Tree Canopy Cover',
      valA: `${first.audit.canopyCoveragePct}%`,
      valB: `${second.audit.canopyCoveragePct}%`,
      winA: first.audit.canopyCoveragePct >= second.audit.canopyCoveragePct,
    },
    {
      label: 'Metro Walk Time',
      valA: `${first.audit.metroWalkMins} min`,
      valB: `${second.audit.metroWalkMins} min`,
      winA: first.audit.metroWalkMins <= second.audit.metroWalkMins,
    },
    {
      label: 'Avg Footpath Width',
      valA: `${first.audit.avgFootpathWidthM}m`,
      valB: `${second.audit.avgFootpathWidthM}m`,
      winA: first.audit.avgFootpathWidthM >= second.audit.avgFootpathWidthM,
    },
    {
      label: 'Heat Island Δ',
      valA: `${first.audit.heatIslandDeltaC > 0 ? '+' : ''}${first.audit.heatIslandDeltaC}°C`,
      valB: `${second.audit.heatIslandDeltaC > 0 ? '+' : ''}${second.audit.heatIslandDeltaC}°C`,
      winA: first.audit.heatIslandDeltaC <= second.audit.heatIslandDeltaC,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-[#0E7C7B]" />
          <h2 className="text-sm font-bold text-[#181D23]">Compare Hyderabad Neighborhoods</h2>
        </div>
        <p className="mt-1 text-xs text-[#525866]">
          Pick any two areas to compare street-audit telemetry under your active priority lens.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="compare-a" className="text-[11px] font-bold uppercase tracking-wider text-[#525866]">
              Area A
            </label>
            <select
              id="compare-a"
              value={first.id}
              onChange={(e) => onSelectCompareSlot(0, e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/12 bg-[#FAF9F6] px-2.5 py-2 text-xs font-semibold text-[#181D23]"
            >
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="compare-b" className="text-[11px] font-bold uppercase tracking-wider text-[#525866]">
              Area B
            </label>
            <select
              id="compare-b"
              value={second.id}
              onChange={(e) => onSelectCompareSlot(1, e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/12 bg-[#FAF9F6] px-2.5 py-2 text-xs font-semibold text-[#181D23]"
            >
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Head-to-Head Score Card */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { item: first, score: scoreA, tier: tierA },
          { item: second, score: scoreB, tier: tierB },
        ].map(({ item, score, tier }) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-3.5 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#525866]">
                  {item.zone}
                </span>
                {compareIds.includes(item.id) && (
                  <button
                    type="button"
                    onClick={() => onRemoveCompare(item.id)}
                    aria-label={`Remove ${item.name} from compare`}
                    className="rounded p-0.5 text-[#525866] hover:bg-black/5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => onSelectNeighborhood(item.id)}
                className="mt-1 text-left text-xs font-bold text-[#181D23] hover:text-[#0E7C7B]"
              >
                {item.name}
              </button>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="font-mono-num text-2xl font-extrabold"
                style={{ color: tier.color }}
              >
                {score}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tier.badgeClass}`}>
                {tier.grade}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pillar Comparison Bars */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">
          Pillar Comparison
        </h3>
        <div className="mt-3 space-y-3">
          {PILLAR_META.map((p) => {
            const a = first.metrics[p.key];
            const b = second.metrics[p.key];
            return (
              <div key={p.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num font-bold text-[#181D23]">{a}</span>
                  <span className="font-semibold text-[#525866]">{p.label}</span>
                  <span className="font-mono-num font-bold text-[#181D23]">{b}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex justify-end overflow-hidden rounded-l-full bg-[#EFECE5] h-2">
                    <div
                      className="h-full rounded-l-full"
                      style={{ width: `${a}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <div className="overflow-hidden rounded-r-full bg-[#EFECE5] h-2">
                    <div
                      className="h-full rounded-r-full"
                      style={{ width: `${b}%`, backgroundColor: p.color, opacity: 0.72 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xs">
        <div className="border-b border-black/8 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#525866]">
          Field Audit Metrics
        </div>
        <div className="divide-y divide-black/6">
          {telemetryRows.map((row) => (
            <div key={row.label} className="grid grid-cols-3 items-center px-4 py-2.5 text-xs">
              <div className="font-mono-num flex items-center gap-1 font-bold text-[#181D23]">
                {row.winA && <Check className="h-3.5 w-3.5 text-[#1F7A4C]" />}
                <span>{row.valA}</span>
              </div>
              <div className="text-center text-[11px] font-medium text-[#525866]">
                {row.label}
              </div>
              <div className="font-mono-num flex items-center justify-end gap-1 font-bold text-[#181D23]">
                <span>{row.valB}</span>
                {!row.winA && <Check className="h-3.5 w-3.5 text-[#1F7A4C]" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
