import { useMemo, useState } from 'react';
import {
  Search,
  ThumbsUp,
  MapPin,
  Download,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { ISSUE_CATEGORIES, ISSUE_STATUSES } from '../data/hyderabadWalkability';
import { downloadFile, exportIssuesCsv, formatShortDate } from '../utils/walkability';

const STATUS_BADGE = {
  Reported: 'bg-orange-50 text-orange-800 border-orange-200',
  Verified: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'In Progress': 'bg-teal-50 text-teal-800 border-teal-200',
  Resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const SEVERITY_BADGE = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function IssueFeedPanel({
  issues,
  neighborhoods,
  upvotedIds,
  selectedIssueId,
  onSelectIssue,
  onToggleUpvote,
  onChangeStatus,
  onOpenReporter,
}) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categoryMap = useMemo(
    () => Object.fromEntries(ISSUE_CATEGORIES.map((c) => [c.id, c])),
    []
  );
  const nhMap = useMemo(
    () => Object.fromEntries(neighborhoods.map((n) => [n.id, n])),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const severityRank = { Critical: 3, Medium: 2, Low: 1 };

    return issues
      .filter((i) => {
        if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
        if (statusFilter !== 'all' && i.status !== statusFilter) return false;
        if (!q) return true;
        const nhName = nhMap[i.neighborhoodId]?.name?.toLowerCase() || '';
        return (
          i.title.toLowerCase().includes(q) ||
          i.street.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          nhName.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'severity') {
          return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
        }
        return 0;
      });
  }, [issues, query, categoryFilter, statusFilter, sortBy, nhMap]);

  return (
    <div className="space-y-3">
      {/* Action + Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white p-3 shadow-xs">
        <button
          type="button"
          onClick={onOpenReporter}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#D96B27] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#C25C1D]"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Drop New Pin
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              downloadFile(
                'walkable-hyd-issues.csv',
                exportIssuesCsv(filtered, neighborhoods),
                'text/csv;charset=utf-8;'
              )
            }
            className="inline-flex items-center gap-1 rounded-xl border border-black/12 bg-[#FAF9F6] px-2.5 py-1.5 text-[11px] font-semibold text-[#181D23] hover:bg-[#EFECE5]"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={() =>
              downloadFile(
                'walkable-hyd-issues.json',
                JSON.stringify(filtered, null, 2),
                'application/json'
              )
            }
            className="inline-flex items-center gap-1 rounded-xl border border-black/12 bg-[#FAF9F6] px-2.5 py-1.5 text-[11px] font-semibold text-[#181D23] hover:bg-[#EFECE5]"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#525866]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search street, landmark, or hazard..."
            aria-label="Search pedestrian issues"
            className="w-full rounded-xl border border-black/12 bg-white py-2 pr-3 pl-9 text-xs text-[#181D23] placeholder:text-[#7B8291]"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by issue category"
            className="rounded-xl border border-black/12 bg-white px-2 py-1.5 text-[11px] font-semibold text-[#181D23]"
          >
            <option value="all">All Categories</option>
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by issue status"
            className="rounded-xl border border-black/12 bg-white px-2 py-1.5 text-[11px] font-semibold text-[#181D23]"
          >
            <option value="all">All Statuses</option>
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort pedestrian issues"
            className="rounded-xl border border-black/12 bg-white px-2 py-1.5 text-[11px] font-semibold text-[#181D23]"
          >
            <option value="upvotes">Most Upvoted</option>
            <option value="severity">Severity First</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Issue Cards */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-center text-xs text-[#525866]">
            No pedestrian issues match the current filters.
          </div>
        ) : (
          filtered.map((issue) => {
            const cat = categoryMap[issue.category] || { label: 'Issue', color: '#D96B27' };
            const nh = nhMap[issue.neighborhoodId];
            const isUpvoted = upvotedIds.includes(issue.id);
            const isSelected = issue.id === selectedIssueId;

            return (
              <article
                key={issue.id}
                className={`rounded-2xl border bg-white p-3.5 transition ${
                  isSelected
                    ? 'border-[#D96B27] ring-2 ring-[#D96B27]/15 shadow-md'
                    : 'border-black/10 hover:border-black/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[11px] font-bold text-[#525866]">{cat.label}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        SEVERITY_BADGE[issue.severity] || SEVERITY_BADGE.Medium
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  <select
                    value={issue.status}
                    onChange={(e) => onChangeStatus(issue.id, e.target.value)}
                    aria-label={`Change status for ${issue.title}`}
                    className={`cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      STATUS_BADGE[issue.status] || STATUS_BADGE.Reported
                    }`}
                  >
                    {ISSUE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectIssue(issue.id)}
                  className="mt-1.5 block text-left"
                >
                  <h3 className="text-sm font-bold leading-snug text-[#181D23] hover:text-[#D96B27]">
                    {issue.title}
                  </h3>
                </button>

                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#525866]">
                  <MapPin className="h-3 w-3 shrink-0 text-[#0E7C7B]" />
                  <span className="truncate">
                    {issue.street}
                    {nh ? ` · ${nh.name.split('&')[0].trim()}` : ''}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[#3F4654]">{issue.description}</p>

                {issue.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {issue.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-[#F7F5F0] px-2 py-0.5 text-[10px] font-semibold text-[#525866]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-black/6 pt-2 text-[11px]">
                  <div className="text-[#525866]">
                    By <strong className="text-[#181D23]">{issue.reportedBy}</strong> ·{' '}
                    {formatShortDate(issue.createdAt)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectIssue(issue.id)}
                      className="font-semibold text-[#0E7C7B] hover:underline"
                    >
                      Fly to pin
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleUpvote(issue.id)}
                      aria-pressed={isUpvoted}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition ${
                        isUpvoted
                          ? 'border-[#181D23] bg-[#181D23] text-white'
                          : 'border-black/12 bg-[#FAF9F6] text-[#181D23] hover:bg-[#EFECE5]'
                      }`}
                    >
                      {issue.status === 'Resolved' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <ThumbsUp className="h-3.5 w-3.5" />
                      )}
                      <span className="font-mono-num">{issue.upvotes}</span>
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
