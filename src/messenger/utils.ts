// 🔗 Import shared formatters - Single Source of Truth for role translations
import { formatRole } from '../utils/formatters';

export const getInitials = (name: string) => {
    if (!name) return '?';
    const initials = name.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return initials || '?';
};

export const getAvatarGradient = (name: string) => {
    const gradients = [
        'bg-gradient-to-br from-rose-500 to-red-700',
        'bg-gradient-to-br from-blue-500 to-indigo-700',
        'bg-gradient-to-br from-emerald-400 to-green-700',
        'bg-gradient-to-br from-amber-400 to-orange-700',
        'bg-gradient-to-br from-violet-500 to-purple-700',
        'bg-gradient-to-br from-fuchsia-500 to-pink-700',
        'bg-gradient-to-br from-cyan-400 to-blue-700',
        'bg-gradient-to-br from-teal-400 to-emerald-700'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
};

// 🔗 Re-export from shared formatters - Single Source of Truth
export const getRoleDisplayName = (role: string) => {
    if (!role) return '';
    return formatRole(role.toLowerCase());
};

export const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    
    // 1. Parse as UTC (Backend Standard)
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    
    // 2. Get App-Configured Offset (Default -5 EST)
    const offset = parseInt(localStorage.getItem('timezone_offset_hours') || '-5');

    // 3. Shift Date and "Now" to App Timezone
    const shiftedDate = new Date(date.getTime() + (offset * 3600000));
    const now = new Date();
    const shiftedNow = new Date(now.getTime() + (offset * 3600000));
    
    // 4. Calculate Yesterday relative to App Timezone
    const shiftedYesterday = new Date(shiftedNow);
    shiftedYesterday.setDate(shiftedNow.getDate() - 1);

    // 5. Compare using ISO strings (which use UTC values) to check "Same Day"
    const isToday = shiftedDate.toISOString().slice(0, 10) === shiftedNow.toISOString().slice(0, 10);
    const isYesterday = shiftedDate.toISOString().slice(0, 10) === shiftedYesterday.toISOString().slice(0, 10);

    // 6. Format using UTC to prevent Browser from applying a second offset
    if (isToday) {
        return shiftedDate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    } else if (isYesterday) {
        return 'Hier';
    } else {
        return shiftedDate.toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });
    }
};

export const getRetentionInfo = (createdAt: string) => {
    const created = new Date(createdAt.endsWith('Z') ? createdAt : createdAt + 'Z');
    const now = new Date();
    const retentionDays = 30;
    const deletionDate = new Date(created.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const diffTime = deletionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime <= 0) {
        return { text: "Suppression imminente", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: "fa-exclamation-triangle" };
    } else if (diffTime < 24 * 60 * 60 * 1000) {
        const hours = Math.ceil(diffTime / (1000 * 60 * 60));
        return { text: `Expire dans ${hours}h`, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: "fa-clock" };
    } else if (diffDays <= 7) {
        return { text: `Reste ${diffDays} jours`, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "fa-hourglass-half" };
    } else {
        return { text: `Reste ${diffDays} jours`, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "fa-shield-alt" };
    }
};

// 🔧 FIX: Proper UTF-8 decoding for JWT payload
// atob() decodes to Latin-1, not UTF-8, causing "É" → "Ã©" issues
export const decodeJwtPayload = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64);
    // Convert Latin-1 binary string to UTF-8
    const bytes = Uint8Array.from(binaryStr, char => char.charCodeAt(0));
    const jsonStr = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(jsonStr);
};

export const getUserIdFromToken = (token: string | null) => {
    if (!token) return null;
    try {
        const payload = decodeJwtPayload(token);
        return payload.userId;
    } catch (e) {
        return null;
    }
};

export const getUserRoleFromToken = (token: string | null) => {
    if (!token) return '';
    try {
        const payload = decodeJwtPayload(token);
        return payload.role || '';
    } catch (e) {
        return '';
    }
};

export const getNameFromToken = (token: string | null) => {
    if (!token) return '';
    try {
        const payload = decodeJwtPayload(token);
        return payload.full_name || payload.name || 'Utilisateur';
    } catch (e) {
        return 'Utilisateur';
    }
};

export const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
