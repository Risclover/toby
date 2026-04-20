export const formatNoteDate = (dateStr?: string): string => {
    const normalized = dateStr?.endsWith("Z") ? dateStr : dateStr + "Z";
    const diff = Math.floor((Date.now() - new Date(normalized!).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(normalized!).toLocaleDateString();
};