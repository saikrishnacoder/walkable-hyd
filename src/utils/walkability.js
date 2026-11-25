export function computeWalkScore(metrics, weights) {
  const totalWeight =
    (weights.shade || 0) +
    (weights.footpath || 0) +
    (weights.metro || 0) +
    (weights.safety || 0);

  if (totalWeight <= 0) return 0;

  const weighted =
    metrics.shade * weights.shade +
    metrics.footpath * weights.footpath +
    metrics.metro * weights.metro +
    metrics.safety * weights.safety;

  return Math.round(weighted / totalWeight);
}

export function getScoreTier(score) {
  if (score >= 82) {
    return {
      grade: 'A',
      label: 'Walker’s Haven',
      color: '#1F7A4C',
      bg: '#E8F5EE',
      border: '#A7DFBF',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  if (score >= 72) {
    return {
      grade: 'B+',
      label: 'Very Walkable',
      color: '#0E7C7B',
      bg: '#E6F4F4',
      border: '#9ED6D5',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    };
  }
  if (score >= 62) {
    return {
      grade: 'B',
      label: 'Somewhat Walkable',
      color: '#D96B27',
      bg: '#FDF0E7',
      border: '#F3C7A9',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    };
  }
  return {
    grade: 'C',
    label: 'Car-Dependent / Needs Work',
    color: '#B91C1C',
    bg: '#FEECEC',
    border: '#F5B5B5',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
  };
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestNeighborhood(lat, lng, neighborhoods) {
  if (!neighborhoods?.length) return null;
  let best = neighborhoods[0];
  let bestDist = Infinity;
  for (const n of neighborhoods) {
    const d = haversineKm(lat, lng, n.lat, n.lng);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportIssuesCsv(issues, neighborhoods) {
  const nhMap = Object.fromEntries(neighborhoods.map((n) => [n.id, n.name]));
  const headers = ['ID', 'Title', 'Category', 'Severity', 'Status', 'Neighborhood', 'Street', 'Lat', 'Lng', 'Upvotes', 'Tags', 'ReportedBy', 'CreatedAt'];
  const escape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const rows = issues.map((i) =>
    [
      i.id,
      i.title,
      i.category,
      i.severity,
      i.status,
      nhMap[i.neighborhoodId] || i.neighborhoodId,
      i.street,
      i.lat,
      i.lng,
      i.upvotes,
      (i.tags || []).join('; '),
      i.reportedBy,
      i.createdAt,
    ]
      .map(escape)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
