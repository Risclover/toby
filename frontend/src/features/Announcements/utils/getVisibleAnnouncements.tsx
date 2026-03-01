import type { Announcement } from "@/store";

const MAX_SEEN_ANNOUNCEMENTS = 4;

export const getVisibleAnnouncements = (allItems: Announcement[], unseenSnapshot: Set<number>, maxSeenDisplay = MAX_SEEN_ANNOUNCEMENTS): Announcement[] => {
    const unseenCount = allItems.filter(item => unseenSnapshot.has(item.id)).length;
    const displayCount = Math.max(unseenCount, maxSeenDisplay);
    return allItems.slice(0, displayCount);
}