// Shared between EventFormRepeat (the main dropdown) and EventFormRepeatCustom
// (the "Custom recurrence" modal).

import dayjs from "dayjs";

export type PresetKind = "none" | "daily" | "weekly" | "monthly" | "annually" | "weekday";

export type RecurrenceEnd =
    | { type: "never" }
    | { type: "on"; date: string } // "YYYY-MM-DD"
    | { type: "after"; occurrences: number };

type RecurrenceBase = { interval: number; end: RecurrenceEnd };

export type CustomRecurrenceRule =
    | ({ freq: "DAILY" } & RecurrenceBase)
    | ({ freq: "WEEKLY"; byDay: string[] } & RecurrenceBase) // full weekday names, e.g. "Tuesday"
    | ({ freq: "MONTHLY"; mode: "day-of-month" | "nth-weekday" } & RecurrenceBase)
    | ({ freq: "YEARLY" } & RecurrenceBase);

const WEEKDAY_ORDER = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const WEEKDAYS_ONLY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function sortByWeekOrder(days: string[]): string[] {
    return [...days].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
}

function pluralizeUnit(unit: string, count: number): string {
    return count === 1 ? unit : `${unit}s`;
}

const ORDINAL_WORDS = ["first", "second", "third", "fourth", "fifth"];

export function nthWeekdaySuffix(date: dayjs.Dayjs): string {
    const weekday = date.format("dddd");
    const occurrenceIndex = Math.floor((date.date() - 1) / 7); // 0-based
    const isLastOccurrence = date.date() + 7 > date.daysInMonth();
    const ordinalWord = isLastOccurrence ? "last" : ORDINAL_WORDS[occurrenceIndex] ?? `${occurrenceIndex + 1}th`;
    return `the ${ordinalWord} ${weekday}`;
}

/** Collapses a full 7-day or Mon-Fri selection into the shorthand Google
 * Calendar uses, instead of spelling out every day. */
function describeWeeklyDays(sortedDays: string[], date: dayjs.Dayjs): string {
    if (sortedDays.length === 0) return date.format("dddd");
    if (sortedDays.length === 7) return "all days";
    if (sortedDays.length === 5 && WEEKDAYS_ONLY.every((d) => sortedDays.includes(d))) {
        return "weekdays";
    }
    return sortedDays.join(", ");
}


/** ", until Oct 18, 2026" / ", 5 times" / "" -- appended to the base label. */
function describeEnd(end: RecurrenceEnd): string {
    switch (end.type) {
        case "never":
            return "";
        case "on":
            return `, until ${dayjs(end.date).format("MMM D, YYYY")}`;
        case "after":
            return `, ${end.occurrences} ${pluralizeUnit("time", end.occurrences)}`;
    }
}

function describeBase(rule: CustomRecurrenceRule, date: dayjs.Dayjs): string {
    switch (rule.freq) {
        case "DAILY":
            return rule.interval === 1 ? "Daily" : `Every ${rule.interval} days`;

        case "WEEKLY": {
            const days = describeWeeklyDays(sortByWeekOrder(rule.byDay), date);
            return rule.interval === 1
                ? `Weekly on ${days}`
                : `Every ${rule.interval} ${pluralizeUnit("week", rule.interval)} on ${days}`;
        }

        case "MONTHLY": {
            const suffix = rule.mode === "day-of-month" ? `day ${date.date()}` : nthWeekdaySuffix(date);
            return rule.interval === 1
                ? `Monthly on ${suffix}`
                : `Every ${rule.interval} ${pluralizeUnit("month", rule.interval)} on ${suffix}`;
        }

        case "YEARLY": {
            const formatted = date.format("MMMM DD");
            return rule.interval === 1
                ? `Annually on ${formatted}`
                : `Every ${rule.interval} ${pluralizeUnit("year", rule.interval)} on ${formatted}`;
        }
    }
}

/**
 * Renders any custom rule into the same style of label the preset options
 * use ("Weekly on Tuesday, Wednesday, until Oct 18, 2026").
 */
export function describeCustomRecurrenceRule(rule: CustomRecurrenceRule, date: dayjs.Dayjs): string {
    return describeBase(rule, date) + describeEnd(rule.end);
}

/**
 * If this custom rule is indistinguishable from one of the plain preset
 * options, returns which preset it matches so the caller can select that
 * instead of adding a duplicate-looking option. A rule with any end
 * condition can never match a preset -- presets repeat forever.
 */
export function matchingPresetKind(rule: CustomRecurrenceRule, date: dayjs.Dayjs): PresetKind | null {
    if (rule.interval !== 1) return null;
    if (rule.end.type !== "never") return null;

    switch (rule.freq) {
        case "DAILY":
            return "daily";
        case "WEEKLY":
            return rule.byDay.length === 1 && rule.byDay[0] === date.format("dddd") ? "weekly" : null;
        case "MONTHLY":
            return rule.mode === "nth-weekday" ? "monthly" : null;
        case "YEARLY":
            return "annually";
    }
}