export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB per user
export const MAX_TAGS_PER_POST = 5;
export const MAX_POST_TITLE_LENGTH = 300;
export const MAX_COMMENT_LENGTH = 10000;
// ---------------------------------------------------------------------------
// Small helpers shared across client/server
// ---------------------------------------------------------------------------
export function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
export function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}
// ---------------------------------------------------------------------------
// String-encoded JSON helpers (SQLite-native storage for lists/objects)
// ---------------------------------------------------------------------------
export function parseStringArray(value) {
    if (!value)
        return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    }
    catch {
        return [];
    }
}
export function serializeStringArray(value) {
    return JSON.stringify(value ?? []);
}
export function parseJson(value, fallback) {
    if (!value)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
export function serializeJson(value) {
    return JSON.stringify(value ?? null);
}
