import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { PILLAR_META, WEIGHT_PRESETS } from '../data/hyderabadWalkability';

export default function WeightControls({
  weights,
  activePresetId,
  onSelectPreset,
  onChangeWeight,
  isExpanded,
  onToggleExpand,
}) {
  const total = weights.shade + weights.footpath + weights.metro + weights.safety || 1;

  return (
    <section
      aria-label="Walkability Priority Weights"
      className="rounded-2xl border border-black/10 bg-white p-3.5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7F5F0] text-[#D96B27]">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#181D23]">
              Score Priority Lens
            </h2>
            <p className="text-[11px] text-[#525866]">
              Re-weights Hyderabad neighborhood scores live
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-[#F7F5F0] px-2.5 py-1 text-xs font-semibold text-[#181D23] hover:bg-[#EFECE5]"
        >
          {isExpanded ? 'Hide sliders' : 'Customize'}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Preset Chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {WEIGHT_PRESETS.map((preset) => {
          const active = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              title={preset.description}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                active
                  ? 'bg-[#181D23] text-white'
                  : 'border border-black/10 bg-[#F7F5F0] text-[#3F4654] hover:bg-[#EAE6DC]'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom Sliders */}
      {isExpanded && (
        <div className="mt-3 space-y-2.5 border-t border-black/8 pt-3">
          {PILLAR_META.map((pillar) => {
            const pct = Math.round((weights[pillar.key] / total) * 100);
            return (
              <div key={pillar.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`weight-${pillar.key}`}
                    className="font-semibold text-[#181D23]"
                  >
                    {pillar.label}
                  </label>
                  <span className="font-mono-num text-[11px] font-bold text-[#525866]">
                    {pct}%
                  </span>
                </div>
                <input
                  id={`weight-${pillar.key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[pillar.key]}
                  onChange={(e) => onChangeWeight(pillar.key, Number(e.target.value))}
                  style={{ accentColor: pillar.color }}
                  className="h-1.5 w-full cursor-pointer rounded-lg bg-[#EAE6DC]"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
