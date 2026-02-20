import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

// 1. Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// 2. Customize the locale to match your "short" style
// By default, dayjs outputs "a few seconds ago", "a minute ago", etc.
dayjs.updateLocale('en', {
    relativeTime: {
        future: "in %s",
        past: "%s ago",
        s: '1s',
        m: "1m",
        mm: "%dm",
        h: "1h",
        hh: "%dh",
        d: "1d",     // We will handle "yesterday" in the logic below
        dd: "%d days",
        M: "a month",
        MM: "%d months",
        y: "a year",
        yy: "%d years"
    }
});

export const getUserTimeZone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

export const getReminderTime = (
    dateInput: string | Date,
    timeZone: string = getUserTimeZone()
): string => {
    let date: Date;

    // 1. FIX: Treat naive strings as UTC
    if (typeof dateInput === 'string' && !dateInput.endsWith('Z')) {
        date = new Date(dateInput + 'Z');
    } else {
        date = new Date(dateInput);
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // 2. Handle "Future" dates (e.g. slightly out of sync clocks)
    if (diffInSeconds < 0) return "just now";

    // 3. "Just now" for very recent
    if (diffInSeconds < 15) return "just now";

    // 4. Seconds (1s, 30s)
    if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    // 5. Minutes (1m, 59m)
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    // 6. Hours (1h, 23h)
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    // 7. Days (1 day ago, 2 days ago)
    // Reddit actually switches to "Month Day" after 24 hours.
    // We use timezone-aware checks to see if it was literally "Yesterday" or older.

    // Helper to get YYYY-MM-DD in user's timezone
    const getDayKey = (d: Date) => {
        return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d); // en-CA gives YYYY-MM-DD
    };

    const todayKey = getDayKey(now);
    const dateKey = getDayKey(date);

    // Check Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = getDayKey(yesterday);

    if (dateKey === yesterdayKey) return "1 day ago"; // Or "yesterday"

    // Check 2 Days Ago
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const twoDaysAgoKey = getDayKey(twoDaysAgo);

    if (dateKey === twoDaysAgoKey) return "2 days ago";

    // 8. Absolute Date (Feb 17)
    const isSameYear = date.getFullYear() === now.getFullYear();

    if (isSameYear) {
        return date.toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric" }); // "Feb 17"
    }

    return date.toLocaleDateString("en-US", { timeZone, month: "short", day: "numeric", year: 'numeric' }); // "Feb 17, 2023"
};