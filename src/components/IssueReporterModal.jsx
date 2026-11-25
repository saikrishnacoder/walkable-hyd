import { useEffect, useState } from 'react';
import { X, Crosshair, MapPin, Send } from 'lucide-react';
import {
  ACCESSIBILITY_TAGS,
  ISSUE_CATEGORIES,
} from '../data/hyderabadWalkability';
import { findNearestNeighborhood } from '../utils/walkability';

export default function IssueReporterModal({
  isOpen,
  neighborhoods,
  draftCoords,
  isPickingLocation,
  onStartPickLocation,
  onSetDraftCoords,
  onClose,
  onSubmitIssue,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0].id);
  const [severity, setSeverity] = useState('Medium');
  const [street, setStreet] = useState('');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [tags, setTags] = useState([]);
  const [neighborhoodId, setNeighborhoodId] = useState(neighborhoods[0]?.id || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (draftCoords) {
      const nearest = findNearestNeighborhood(
        draftCoords.lat,
        draftCoords.lng,
        neighborhoods
      );
      if (nearest) {
        setNeighborhoodId(nearest.id);
      }
    }
  }, [draftCoords, neighborhoods]);

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNeighborhoodChange = (id) => {
    setNeighborhoodId(id);
    const target = neighborhoods.find((n) => n.id === id);
    if (target) {
      onSetDraftCoords({ lat: target.lat, lng: target.lng });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !street.trim() || !description.trim()) {
      setError('Please add a title, street/landmark, and short description.');
      return;
    }

    const fallbackNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId) || neighborhoods[0];
    const coords = draftCoords || {
      lat: fallbackNeighborhood.lat,
      lng: fallbackNeighborhood.lng,
    };

    onSubmitIssue({
      title: title.trim(),
      category,
      severity,
      neighborhoodId,
      street: street.trim(),
      lat: coords.lat,
      lng: coords.lng,
      description: description.trim(),
      tags,
      reportedBy: reportedBy.trim() || 'Hyderabad Walker',
    });

    setTitle('');
    setStreet('');
    setDescription('');
    setTags([]);
    setError('');
  };

  // While user is actively clicking on the map to drop pin, shrink modal to compact floating card
  if (isPickingLocation) {
    return (
      <div className="fixed bottom-5 right-5 z-[1100] w-80 rounded-2xl border border-[#D96B27] bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#181D23]">
            <Crosshair className="h-4 w-4 text-[#D96B27]" />
            Map Pin Placement Active
          </div>
          <button
            type="button"
            onClick={() => onStartPickLocation(false)}
            className="rounded-lg bg-[#181D23] px-2.5 py-1 text-xs font-semibold text-white"
          >
            Back to Form
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[#525866]">
          Click anywhere on the map or drag the orange pin. Coordinates update automatically.
        </p>
        {draftCoords && (
          <div className="font-mono-num mt-2 rounded-lg bg-[#F7F5F0] px-2.5 py-1.5 text-[11px] font-semibold text-[#181D23]">
            {draftCoords.lat.toFixed(5)}, {draftCoords.lng.toFixed(5)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/8 bg-white px-5 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D96B27]">
              Civic Pedestrian Report
            </span>
            <h2 id="report-modal-title" className="text-lg font-extrabold text-[#181D23]">
              Report a Street or Footpath Issue
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close issue reporter"
            className="rounded-lg p-1.5 text-[#525866] hover:bg-black/5 hover:text-[#181D23]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          {/* Location Pin Box */}
          <div className="rounded-xl border border-black/10 bg-[#FAF9F6] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#181D23]">
                  <MapPin className="h-4 w-4 text-[#D96B27]" />
                  Pin Coordinates
                </div>
                <div className="font-mono-num mt-0.5 text-xs text-[#525866]">
                  {draftCoords
                    ? `${draftCoords.lat.toFixed(5)}, ${draftCoords.lng.toFixed(5)}`
                    : 'Using neighborhood center'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onStartPickLocation(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D96B27] bg-white px-3 py-1.5 text-xs font-bold text-[#D96B27] hover:bg-orange-50"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Pick Pin on Map
              </button>
            </div>

            <div className="mt-3">
              <label htmlFor="issue-neighborhood" className="block text-[11px] font-bold uppercase tracking-wider text-[#525866]">
                Neighborhood Zone
              </label>
              <select
                id="issue-neighborhood"
                value={neighborhoodId}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/12 bg-white px-3 py-2 text-xs font-semibold text-[#181D23]"
              >
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label htmlFor="issue-title" className="block text-xs font-bold text-[#181D23]">
              Issue Summary *
            </label>
            <input
              id="issue-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Open manhole cover blocking footpath near Metro exit"
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-[#181D23] placeholder:text-[#88909E]"
            />
          </div>

          {/* Street / Landmark */}
          <div>
            <label htmlFor="issue-street" className="block text-xs font-bold text-[#181D23]">
              Exact Street / Landmark *
            </label>
            <input
              id="issue-street"
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="e.g., Road No. 45 near Jubilee Hills Check Post Pillar 1571"
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-[#181D23] placeholder:text-[#88909E]"
            />
          </div>

          {/* Category & Severity */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="issue-category" className="block text-xs font-bold text-[#181D23]">
                Issue Category
              </label>
              <select
                id="issue-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-[#181D23]"
              >
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#181D23]">Severity</span>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {['Low', 'Medium', 'Critical'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`rounded-xl border py-2 text-xs font-bold transition ${
                      severity === lvl
                        ? lvl === 'Critical'
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-[#181D23] bg-[#181D23] text-white'
                        : 'border-black/12 bg-[#FAF9F6] text-[#3F4654] hover:bg-black/5'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="issue-desc" className="block text-xs font-bold text-[#181D23]">
              What makes walking difficult here? *
            </label>
            <textarea
              id="issue-desc"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe footpath width, crossing danger, lighting gap, or obstruction..."
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-[#181D23] placeholder:text-[#88909E]"
            />
          </div>

          {/* Accessibility Impact Tags */}
          <div>
            <span className="block text-xs font-bold text-[#181D23]">
              Accessibility & Safety Impact Tags
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ACCESSIBILITY_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? 'border-[#0E7C7B] bg-[#0E7C7B] text-white'
                        : 'border-black/12 bg-[#F7F5F0] text-[#3F4654] hover:bg-[#EAE6DC]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reporter Name */}
          <div>
            <label htmlFor="issue-reporter" className="block text-xs font-bold text-[#181D23]">
              Your Name / Handle (optional)
            </label>
            <input
              id="issue-reporter"
              type="text"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              placeholder="e.g., Priya D."
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-[#181D23] placeholder:text-[#88909E]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-black/8 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-black/12 px-4 py-2 text-xs font-semibold text-[#3F4654] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D96B27] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#C25C1D]"
            >
              <Send className="h-3.5 w-3.5" />
              Publish Issue to Map
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
