import type { Reminder } from "@/store";

const MAX_SEEN_REMINDERS = 4;

export const getVisibleReminders = (
    allItems: Reminder[],
    unseenSnapshot: Set<number>,
    maxSeenDisplay = MAX_SEEN_REMINDERS
): Reminder[] => {
    const unseenCount = allItems.filter(item => unseenSnapshot.has(item.id)).length;
    const displayCount = Math.max(unseenCount, maxSeenDisplay);
    return allItems.slice(0, displayCount);
};