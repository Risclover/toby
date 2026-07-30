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

export const WEEKDAY_ORDER = [
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
    const { index, isLast } = weekdayOccurrenceInMonth(date);
    const ordinalWord = isLast ? "last" : ORDINAL_WORDS[index - 1] ?? `${index}th`;
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

/** ---------- RRULE serialization ---------- */

const DAY_TO_ICS: Record<string, string> = {
    Sunday: "SU", Monday: "MO", Tuesday: "TU", Wednesday: "WE",
    Thursday: "TH", Friday: "FR", Saturday: "SA",
};

/** 1-based occurrence of this weekday within its month (2nd Tuesday = 2),
 * and whether it's the LAST occurrence of that weekday in the month.
 * Shared by nthWeekdaySuffix (word form, for display) and the numeric
 * BYDAY ordinal RRULE needs ("3TU", "-1SA", ...). */
function weekdayOccurrenceInMonth(date: dayjs.Dayjs): { index: number; isLast: boolean } {
    const index = Math.floor((date.date() - 1) / 7) + 1;
    const isLast = date.date() + 7 > date.daysInMonth();
    return { index, isLast };
}

function bydayOrdinalCode(date: dayjs.Dayjs): string {
    const { index, isLast } = weekdayOccurrenceInMonth(date);
    return `${isLast ? -1 : index}${DAY_TO_ICS[date.format("dddd")]}`;
}

/** "2026-10-18" -> "20261018" (RFC5545 DATE value -- no time, floating,
 * used when the event itself has no time of day). */
function toIcsUntilDate(dateStr: string): string {
    return dateStr.replace(/-/g, "");
}

/** "2026-10-18" -> "20261018T235959Z" -- last instant of that day, in the
 * browser's own local zone, expressed in UTC. QuickAddEvent always derives
 * tzid from Intl.DateTimeFormat().resolvedOptions().timeZone (the
 * browser's own zone), so "local" here already matches the event's tzid --
 * no separate zone conversion needed. RFC5545 requires UNTIL to be a UTC
 * DATE-TIME when DTSTART has a time component. */
function toIcsUntilUtc(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const nextLocalMidnight = new Date(y, (m ?? 1) - 1, (d ?? 1) + 1, 0, 0, 0, 0);
    const lastInstant = new Date(nextLocalMidnight.getTime() - 1000);
    return lastInstant.toISOString().slice(0, 19).replace(/[-:]/g, "") + "Z";
}

function customRuleToRRuleString(rule: CustomRecurrenceRule, date: dayjs.Dayjs, hasTime: boolean): string {
    const parts = [`FREQ=${rule.freq}`];
    if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);

    if (rule.freq === "WEEKLY") {
        parts.push(`BYDAY=${rule.byDay.map((d) => DAY_TO_ICS[d]).join(",")}`);
    } else if (rule.freq === "MONTHLY") {
        parts.push(
            rule.mode === "day-of-month" ? `BYMONTHDAY=${date.date()}` : `BYDAY=${bydayOrdinalCode(date)}`
        );
    }

    if (rule.end.type === "after") {
        parts.push(`COUNT=${rule.end.occurrences}`);
    } else if (rule.end.type === "on") {
        parts.push(`UNTIL=${hasTime ? toIcsUntilUtc(rule.end.date) : toIcsUntilDate(rule.end.date)}`);
    }

    return parts.join(";");
}

function presetToRRuleString(kind: PresetKind, date: dayjs.Dayjs): string | null {
    switch (kind) {
        case "none":
            return null;
        case "daily":
            return "FREQ=DAILY";
        case "weekly":
            return `FREQ=WEEKLY;BYDAY=${DAY_TO_ICS[date.format("dddd")]}`;
        case "monthly":
            return `FREQ=MONTHLY;BYDAY=${bydayOrdinalCode(date)}`;
        case "annually":
            return "FREQ=YEARLY";
        case "weekday":
            return "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";
    }
}

/**
 * Builds the actual RRULE string to send to the backend, from whatever is
 * currently selected in EventFormRepeat. Presets never have an end
 * condition -- only custom rules can produce COUNT/UNTIL. Returns null for
 * "Does not repeat" or an unconfigured custom selection.
 */
export function buildRRule(
    kind: PresetKind | "custom",
    customRule: CustomRecurrenceRule | null,
    date: dayjs.Dayjs,
    hasTime: boolean
): string | null {
    if (kind === "custom") {
        return customRule ? customRuleToRRuleString(customRule, date, hasTime) : null;
    }
    return presetToRRuleString(kind, date);
}