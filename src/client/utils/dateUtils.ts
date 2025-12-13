// Date Utilities based on legacy logic

export const getNowEST = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Default to -5 (EST) if not found, but logic implies we rely on offset
  // In legacy code: parseInt(localStorage.getItem('timezone_offset_hours') || '-5')
  // We'll check localStorage in browser context, default to -5
  const offset = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('timezone_offset_hours') || '-5') 
    : -5;
  return new Date(utc + (3600000 * offset)).getTime();
};

export const formatDateEST = (dateStr: string | undefined, includeTime = true) => {
  if (!dateStr) return '';
  
  // Clean string and standardize
  let cleanStr = dateStr.replace(' ', 'T');
  
  // Standard D1/SQLite timestamp from CURRENT_TIMESTAMP is UTC (e.g. 2023-10-27 15:00:00)
  // But it has no 'Z' suffix.
  // My previous "Smart Shift" logic FAILED because it assumed "No Z" = "Already Local".
  // This caused UTC times to be displayed as-is (e.g. 15:00), which users interpreted as wrong.
  
  // FIX: We must treat ambiguous strings as UTC if they come from the DB.
  // We append 'Z' to force UTC interpretation.
  const isAmbiguous = !cleanStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(cleanStr);
  if (isAmbiguous) {
    cleanStr += 'Z';
  }
  
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) return dateStr;
  
  // Always apply offset since we now treat everything as UTC-based
  // This matches legacy behavior which was correct for DB timestamps
  const offset = typeof window !== 'undefined' 
      ? parseInt(localStorage.getItem('timezone_offset_hours') || '-5') 
      : -5;

  // Manually shift the UTC time by the offset
  // Example: 15:00 UTC + (-5h) = 10:00 UTC (Effectively EST)
  const adjustedDate = new Date(date.getTime() + (offset * 3600000));

  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: includeTime ? '2-digit' : undefined,
    minute: includeTime ? '2-digit' : undefined,
    hour12: false,
    timeZone: 'UTC' // Restore UTC to respect the manual shift
  }).format(adjustedDate);
};

export interface LoginStatus {
  color: string;
  status: string;
  time: string;
  dot: string;
}

export const getLastLoginStatus = (lastLogin: string | undefined): LoginStatus => {
  if (!lastLogin) return { color: "text-gray-500", status: "Jamais connecté", time: "", dot: "bg-gray-400" };

  const now = getNowEST();
  const offset = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('timezone_offset_hours') || '-5') 
    : -5;

  // Parse date safely
  const loginDate = new Date((lastLogin.includes('T') ? lastLogin : lastLogin.replace(' ', 'T')) + (lastLogin.includes('Z') ? '' : 'Z'));
  const adjustedLoginDate = new Date(loginDate.getTime() + (offset * 3600000));
  
  const diffMs = now - adjustedLoginDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 5) return { color: "text-green-600", status: "En ligne", time: "Actif maintenant", dot: "bg-green-500" };
  if (diffMins < 60) return { color: "text-yellow-600", status: "Actif récemment", time: "Il y a " + diffMins + " min", dot: "bg-yellow-500" };
  
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return { color: "text-blue-700", status: "Actif aujourd'hui", time: "Il y a " + diffHours + "h", dot: "bg-amber-600" };
  
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return { color: "text-red-600", status: "Inactif", time: "Hier", dot: "bg-red-500" };
  
  return { color: "text-red-600", status: "Inactif", time: "Il y a " + diffDays + " jours", dot: "bg-red-500" };
};

export const localDateTimeToUTC = (localDateTimeStr: string) => {
  if (!localDateTimeStr) return null;
  const date = new Date(localDateTimeStr);
  return date.toISOString().replace('T', ' ').slice(0, 19);
};
