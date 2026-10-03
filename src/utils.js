const KENYA_OFFSET_MINUTES = 180; // EAT = UTC+3, no DST

export function tipDateTimeToDate(dateStr, timeStr) {
    if (!dateStr) return null;
  
    const [m, d, y] = dateStr.split('/').map(Number);
    const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  
    if (!m || !d || !y) return null;
  
    // 1. Build the wall-clock time as if it were UTC
    const asUtcMs = Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0);
  
    // 2. Kenya is UTC+3, so the real UTC instant is 3 hours earlier
    const utcMs = asUtcMs - KENYA_OFFSET_MINUTES * 60 * 1000;
  
    return new Date(utcMs);
}