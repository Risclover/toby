import type { ComponentProps } from "react";
import type { Schedule } from "@mantine/schedule";
import type { CalendarEvent } from "@/store";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { RRule, RRuleSet } from "rrule";

dayjs.extend(utc);
dayjs.extend(timezone);

type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];

export type HouseholdMemberColor = { id: number; color: string; firstName: string };

export type EventColorPayload = {
    colors: string[];
    memberNames: string[];
    hasTime: boolean;
    visibility: string;
    allMembers: boolean;
    attendeeIds: number[];
    tzid: string;
    source: CalendarEvent;
    /** Stashed by toDayViewEvents on every day-segment of a split multi-day
     * event, so EventDetailsModal can show the event's true full span
     * instead of whichever single day's clipped start/end was clicked. */
    originalStart?: string;
    originalEnd?: string;
    [key: string]: unknown;
};

function getAssignedMembers(
    event: Pick<CalendarEvent, "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): HouseholdMemberColor[] {
    const assignedIds = event.allMembers ? members.map((m) => m.id) : event.attendeeIds ?? [];
    const byId = new Map(members.map((m) => [m.id, m]));
    return assignedIds.map((id) => byId.get(id)).filter((m): m is HouseholdMemberColor => Boolean(m));
}

export function getEventColors(
    event: Pick<CalendarEvent, "color" | "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): string[] {
    const assigned = getAssignedMembers(event, members);
    return assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? "blue"];
}

function toAllDayBoundary(value: string | dayjs.Dayjs, tzid: string): string {
    return dayjs(value).tz(tzid).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * CalendarEvent["hasTime"] is typed as `boolean`, but it's a raw pass-through
 * of a backend boolean column, and has been observed coming back as the
 * STRING "1"/"0" instead of a real JSON boolean (presumably wherever the API
 * serializes it without an explicit bool cast). Every "is this all-day"
 * check in this file used to be a strict `=== false`, which is silently
 * always false for a string -- "0" === false is false, same as "1" === false
 * -- so EVERY event, all-day or not, was being treated as timed. An all-day
 * event still visually "worked" only by accident (its raw startUtc/endUtc
 * happen to be UTC-anchored boundary timestamps already), while it also
 * meant Mantine's own top-level `allDay` flag (see toScheduleEvent) was
 * wrongly false for every all-day event too, misplacing it into the timed
 * grid instead of the all-day row. Coercing once, here, means every other
 * `=== false` check in this file (against payload.hasTime, which this
 * function's caller normalizes through here) can stay a plain, correct
 * boolean comparison instead of every call site needing its own defense.
 */
function isAllDayValue(hasTime: unknown): boolean {
    return hasTime === false || hasTime === "0" || hasTime === 0 || hasTime === "false";
}

function toEventStart(event: Pick<CalendarEvent, "startUtc" | "hasTime" | "tzid">): string {
    return isAllDayValue(event.hasTime) ? toAllDayBoundary(event.startUtc, event.tzid ?? "UTC") : event.startUtc;
}

function toEventEnd(event: Pick<CalendarEvent, "endUtc" | "hasTime" | "tzid">): string {
    return isAllDayValue(event.hasTime)
        ? toAllDayBoundary(dayjs(event.endUtc).subtract(1, "second"), event.tzid ?? "UTC")
        : event.endUtc;
}

function toEventPayload(event: CalendarEvent, colors: string[], memberNames: string[]): EventColorPayload {
    return {
        colors,
        memberNames,
        // Normalized to a real boolean here (see isAllDayValue) so every
        // other `payload.hasTime === false` check in this file downstream
        // of toEventPayload can trust it's an actual boolean, not whatever
        // raw value the backend happened to send.
        hasTime: !isAllDayValue(event.hasTime),
        visibility: event.visibility,
        allMembers: event.allMembers,
        attendeeIds: event.attendeeIds,
        tzid: event.tzid ?? "UTC",
        source: event,
    };
}

/**
 * The schedule library only learns about excluded occurrences from
 * recurrence.exdate on the event object itself (docs: "generate occurrence
 * start times... remove occurrences that match exdate entries") -- it has
 * no other mechanism. persistEventMove correctly tells the BACKEND to
 * record an exclusion (exclude-occurrence -> event.exdate), but if we
 * never read that back into recurrence.exdate here, the library keeps
 * re-expanding the full, unfiltered rrule on every render. That's why a
 * detached occurrence looked "duplicated" instead of moved: the backend
 * exclusion was real, we just never told the library about it.
 */
function toRecurrence(event: Pick<CalendarEvent, "rrule" | "exdate">) {
    return event.rrule ? { recurrence: { rrule: event.rrule, exdate: event.exdate ?? [] } } : {};
}

export function toScheduleEvent(event: CalendarEvent, members: HouseholdMemberColor[]): ScheduleEventData {
    const assigned = getAssignedMembers(event, members);
    const colors = assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? "blue"];
    const memberNames = assigned.map((m) => m.firstName);
    const base = {
        id: event.id,
        title: event.title,
        start: toEventStart(event),
        end: toEventEnd(event),
        color: colors[0],
        // Mantine's own top-level allDay flag - separate from our payload.hasTime,
        // which only drives our own formatting/display logic. Without this, the
        // library has no idea an event is all-day and places it in the timed grid
        // using raw start/end instead of the all-day row, which for a multi-day
        // all-day event meant it rendered wrong on day 1 and vanished after.
        allDay: isAllDayValue(event.hasTime),
        payload: toEventPayload(event, colors, memberNames),
    };
    return { ...base, ...toRecurrence(event) } as ScheduleEventData;
}

/**
 * Feeds MobileMonthView's `events` prop, which drives the below-grid
 * selected-day event list (Mantine's own eventsList, built from this same
 * array via getMobileMonthViewEvents/sortEvents - confirmed by reading
 * MobileMonthView.mjs directly). Each real event still has to survive as
 * its own entry (title, payload, id) rather than collapsing into an
 * anonymous day+color marker, or real events would silently drop out of
 * the list.
 *
 * NOTE: this no longer drives the grid's own day-cell dots - see
 * toMobileMonthDayDots below. Reading MobileMonthView.mjs showed Mantine's
 * built-in indicators are one dot per EVENT in this array, hardcoded
 * (dayEvents.slice(0, 3)) with no way to inject different content via
 * props - which is exactly what made 3 separate same-person events on one
 * day look like "duplicate dots." The grid now gets its dots from a
 * separately deduplicated source; this function's job is now just "feed
 * the list correctly," same as it always was.
 *
 * Unlike toMobileMonthDayDots (below), this can't stop at toRangeEvents'
 * day-span loop and return deduplicated markers - the list still needs
 * full per-event fidelity, one real entry per event rather than one per
 * (day, color).
 *
 * What WAS missing: this never got switched over to pre-expanding
 * recurring events through toRangeEvents, so MobileMonthView was still
 * doing its own internal rrule expansion off the raw `recurrence` field -
 * the exact DST-adjacent bug toRangeEvents exists to route around (see
 * expandRecurringOccurrencesInRange): an occurrence computed on the other
 * side of a DST transition from the event's dtstart can land on the wrong
 * calendar day. Expanding first means every recurring event arrives as
 * concrete, correctly-dated occurrences before the per-attendee fan-out
 * below ever runs, so Mantine never computes an occurrence date itself.
 *
 * ALSO missing (found once FullPageCalendar started controlling
 * MobileMonthView's selectedDate - see its mobileSelectedDate comment):
 * MobileMonthView buckets this array's events by day ITSELF, to build the
 * below-grid list for whichever day is selected, and that bucketing only
 * ever keys a multi-day event under its own START day - the same
 * limitation Day view has, which is exactly why toDayViewEvents exists.
 * A still-whole 2-day event handed in here showed up fine when its first
 * day was selected, then "No events" on its second day, even though
 * toMobileMonthDayDots (below) correctly marks the grid's dots on every
 * day the event spans - that function does its own day-by-day loop rather
 * than relying on Mantine's bucketing, so it never had this problem.
 * Fixed the same way Day view is: splitEventIntoDaySegments first, so a
 * multi-day event arrives as one real per-day entry Mantine's bucketing
 * can actually find, before the per-attendee fan-out below runs.
 *
 * Takes the same (scheduleEvents, rangeStart, rangeEnd) shape as
 * toRangeEvents now, rather than a single raw CalendarEvent - the caller
 * passes the whole visible list once instead of flatMapping this
 * per-event, matching how Week/Month already work.
 */
export function toMobileMonthEvents(
    scheduleEvents: ScheduleEventData[],
    rangeStart: string,
    rangeEnd: string
): ScheduleEventData[] {
    const expandedEvents = toRangeEvents(scheduleEvents, rangeStart, rangeEnd);

    // See the day-bucketing paragraph above - this is the same splitter
    // toDayViewEvents already uses, reused rather than reimplemented, so
    // a continuation day's entry carries the same originalStart/
    // originalEnd/isDayViewContinuation payload shape EventDetailsModal
    // already knows how to read, regardless of which view's list it came
    // from.
    const daySplitEvents = expandedEvents.flatMap((event) =>
        splitEventIntoDaySegments(event, event.payload as EventColorPayload | undefined)
    );

    return daySplitEvents.flatMap((event) => {
        const payload = event.payload as EventColorPayload | undefined;
        const colors = payload?.colors ?? [event.color as string];

        if (colors.length <= 1) {
            return [event];
        }

        // One entry per attendee color, same as before - renderMobileMonthEvent
        // hides every isDotSibling entry from the below-grid list so a
        // multi-attendee event still shows as exactly one row there.
        return colors.map((color, i) => ({
            ...event,
            id: `${event.id}::dot${i}`,
            color,
            payload: { ...payload, isDotSibling: i > 0 },
        } as ScheduleEventData));
    });
}

/**
 * Computes, for each date in [rangeStart, rangeEnd], the distinct set of
 * attendee colors with at least one event that day - what the mobile month
 * grid's day-cell dots are drawn from now, instead of Mantine's own
 * built-in per-event indicators. Reading MobileMonthView.mjs directly
 * confirmed those built-in indicators are one dot per EVENT occupying that
 * day (capped at 3), hardcoded with no way to inject different content via
 * props - getDayProps only ever contributes className/style/onClick onto
 * the day button, never children. That "one dot per event" design is
 * exactly what produced the "duplicate" dots: 3 separate events for the
 * same person on the same day legitimately drew 3 same-colored dots.
 *
 * This groups by DAY and DEDUPLICATES by color instead - one-marker-per-
 * (day,color), so a day gets exactly one entry per distinct person with
 * something on, regardless of how many separate events that person has.
 * This function itself returns every distinct color found per day,
 * unbounded (TOBY's 8-member household cap keeps it naturally small) -
 * it's toMemberColorStripe (below) that turns this list into the actual
 * CSS FullPageCalendar's getMobileDayProps writes onto each day button.
 *
 * Multi-day events (recurring or not) mark every day they span - a 3-day
 * trip shows that person's mark on all 3 days it covers, not just the
 * start day.
 */
export function toMobileMonthDayDots(
    scheduleEvents: ScheduleEventData[],
    rangeStart: string,
    rangeEnd: string
): Record<string, string[]> {
    const dayColors = new Map<string, Set<string>>();
    const expandedEvents = toRangeEvents(scheduleEvents, rangeStart, rangeEnd);

    for (const event of expandedEvents) {
        const payload = event.payload as EventColorPayload | undefined;
        const colors = payload?.colors ?? [event.color as string];

        const firstDay = dayjs(event.start).startOf("day");
        const lastDay = dayjs(event.end).startOf("day");
        const dayCount = Math.max(lastDay.diff(firstDay, "day"), 0);

        for (let i = 0; i <= dayCount; i++) {
            const day = firstDay.add(i, "day").format("YYYY-MM-DD");
            if (!dayColors.has(day)) dayColors.set(day, new Set());
            const daySet = dayColors.get(day)!;
            for (const color of colors) daySet.add(color);
        }
    }

    const result: Record<string, string[]> = {};
    for (const [day, colors] of dayColors) {
        result[day] = Array.from(colors);
    }
    return result;
}

/** Splits ONE non-recurring event (already known to span multiple days)
 * into one Day view segment per day it covers. Shared by the plain
 * multi-day path below and expandRecurringOccurrencesForDay, so a
 * recurring event's multi-day occurrence gets split exactly the same way
 * a plain multi-day event does, instead of the two slowly drifting apart. */
function splitEventIntoDaySegments(event: ScheduleEventData, payload: EventColorPayload | undefined): ScheduleEventData[] {
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const firstDay = start.startOf("day");
    const lastDay = end.startOf("day");
    const dayCount = lastDay.diff(firstDay, "day");

    if (dayCount <= 0) return [event];

    const dayBoundaryEnd = (day: ReturnType<typeof dayjs>) =>
        day.add(1, "day").subtract(1, "second").format("YYYY-MM-DD HH:mm:ss");

    // Stashed on every day-segment so EventDetailsModal can show the
    // event's true full span instead of whichever single day's entry
    // was clicked.
    const originalSpan = {
        originalStart: event.start as string,
        originalEnd: event.end as string,
    };

    if (payload?.hasTime === false) {
        // Day view only ever shows one day at a time and doesn't itself
        // resolve "does this multi-day all-day event cover the day
        // currently shown" the way WeekView's whole-week layout can --
        // left as a single object spanning multiple days, it only
        // rendered (and mis-rendered, into the timed grid) on its own
        // start day and vanished entirely afterward. One entry per
        // spanned day, each spanning that WHOLE day (00:00-23:59, the
        // same shape a genuine single-day all-day event already has).
        return Array.from({ length: dayCount + 1 }, (_, i) => {
            const day = firstDay.add(i, "day");
            return {
                ...event,
                id: i === 0 ? event.id : `${event.id}::allDayContinuation${i}`,
                start: day.format("YYYY-MM-DD HH:mm:ss"),
                end: dayBoundaryEnd(day),
                payload: { ...payload, ...originalSpan, ...(i > 0 ? { isDayViewContinuation: true } : {}) },
            } as ScheduleEventData;
        });
    }

    const segments: ScheduleEventData[] = [{
        ...event,
        end: dayBoundaryEnd(firstDay),
        payload: { ...payload, ...originalSpan },
    } as ScheduleEventData];

    for (let i = 1; i <= dayCount; i++) {
        const day = firstDay.add(i, "day");
        const isFinalDay = i === dayCount;
        segments.push({
            ...event,
            id: `${event.id}::continuation${i}`,
            start: day.format("YYYY-MM-DD HH:mm:ss"),
            end: isFinalDay ? end.format("YYYY-MM-DD HH:mm:ss") : dayBoundaryEnd(day),
            payload: { ...payload, ...originalSpan, isDayViewContinuation: true },
        } as ScheduleEventData);
    }
    return segments;
}

/** Builds a Date whose UTC fields equal the wall-clock string's fields.
 * rrule.js does its calendar arithmetic (weekday/month/day-of-month rules,
 * and simply adding N days/weeks/months between occurrences) using a Date's
 * UTC getters as the canonical "wall clock" -- it was designed this way
 * specifically so real-world DST transitions never perturb its calendar
 * math. If we instead hand it a Date built via local-time parsing, its UTC
 * fields drift by whatever the local UTC offset happens to be that day --
 * and that offset itself changes across a DST transition. rrule would then
 * silently be doing its "add 7 days" arithmetic against a wall clock that
 * jumps by an hour every time an occurrence's DST regime differs from
 * dtstart's, corrupting that occurrence's calendar date by up to a day.
 * Building dtstart/exdate/the search window this way, and reading
 * occurrences back with dayjs.utc(...) instead of dayjs(...), keeps every
 * step of the rrule math in the same DST-proof UTC-fields space. */
function wallClockToRRuleDate(value: string): Date {
    const [datePart, timePart = "00:00:00"] = value.split(" ");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute, second] = timePart.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second || 0));
}

/** Expands ONE recurring event's occurrences that fall (even partially)
 * within [rangeStart, rangeEnd] (inclusive "YYYY-MM-DD" dates) into plain,
 * concrete, non-recurring events, using the DST-proof UTC-fields math from
 * wallClockToRRuleDate above. A non-recurring event passes through
 * unchanged, so callers can flatMap every event uniformly regardless of
 * whether it recurs.
 *
 * This is what toRangeEvents (Week/Month/Agenda) and
 * expandRecurringOccurrencesForDay (Day view) both build on -- one shared
 * implementation of "which concrete dates does this rrule actually land
 * on," instead of each view computing it independently and risking the
 * same DST bug creeping back into one of them later. */
function expandRecurringOccurrencesInRange(
    event: ScheduleEventData,
    rangeStart: string,
    rangeEnd: string
): ScheduleEventData[] {
    const recurrence = event.recurrence as { rrule: string; exdate: string[] } | undefined;
    if (!recurrence?.rrule) return [event];

    const payload = event.payload as EventColorPayload | undefined;
    const isAllDay = payload?.hasTime === false;
    const tzid = payload?.tzid ?? "UTC";

    // event.start/end are ALREADY a naive wall-clock string for an all-day
    // event (see toAllDayBoundary), but a real UTC-Z instant for a timed
    // one (see toEventStart/toEventEnd) -- wallClockToRRuleDate needs the
    // former. Feeding it a real ISO string directly (as this used to)
    // produces Invalid Date immediately, and even patched to not crash,
    // rrule would be computing "every Monday" against a fixed UTC hour
    // instead of a fixed LOCAL hour -- drifting the displayed time by an
    // hour across every DST transition, the exact class of bug this whole
    // file exists to avoid. Converting to the event's OWN tzid first (not
    // the viewer's) keeps a timed recurring event at the same local
    // wall-clock time across DST, same as every other value in this file.
    const toMasterWallClock = (value: string): string =>
        isAllDay ? value : dayjs(value).tz(tzid).format("YYYY-MM-DD HH:mm:ss");

    const dtstart = wallClockToRRuleDate(toMasterWallClock(event.start as string));
    const durationMs = wallClockToRRuleDate(toMasterWallClock(event.end as string)).getTime() - dtstart.getTime();

    let rule: RRule;
    try {
        rule = new RRule({ ...RRule.parseString(recurrence.rrule), dtstart } as any);
    } catch {
        return [];
    }

    const set = new RRuleSet();
    set.rrule(rule);
    // exdate entries are always written BY US (see recurrenceId below) as
    // the wall-clock-in-tzid string, i.e. already in the same space
    // dtstart lives in -- so, unlike event.start/end above, they parse
    // directly with no hasTime branching needed.
    (recurrence.exdate ?? []).forEach((ex) => {
        try { set.exdate(wallClockToRRuleDate(ex)); } catch { /* ignore a bad exdate entry */ }
    });

    // Pad the search window back by the event's own duration, so an
    // occurrence that STARTED before rangeStart but still overlaps it (a
    // multi-day occurrence beginning the day before the visible range)
    // isn't missed.
    const durationDays = Math.max(Math.ceil(durationMs / 86_400_000), 1);
    const windowStart = wallClockToRRuleDate(dayjs(rangeStart).subtract(durationDays, "day").format("YYYY-MM-DD 00:00:00"));
    const windowEnd = wallClockToRRuleDate(dayjs(rangeEnd).format("YYYY-MM-DD 23:59:59"));
    const format = "YYYY-MM-DD HH:mm:ss";

    return set.between(windowStart, windowEnd, true).map((occStart) => {
        const occEnd = new Date(occStart.getTime() + durationMs);
        // occStart/occEnd's UTC fields ARE the wall-clock-in-tzid civil
        // date/time rrule actually computed, regardless of which DST
        // regime this occurrence's real calendar date falls in relative
        // to dtstart -- see wallClockToRRuleDate.
        const occStartWallClock = dayjs.utc(occStart).format(format);
        const occEndWallClock = dayjs.utc(occEnd).format(format);

        // All-day keeps that naive string as-is, matching every other
        // all-day value in this file. A timed occurrence has to be
        // converted back to a real UTC-Z instant, matching how
        // toEventStart/toEventEnd represent every other timed event --
        // otherwise EventDetailsModal's parseWallClock (and anything else
        // downstream) would treat it as the VIEWER's own local time
        // instead of the event's actual instant.
        const occStartOut = isAllDay ? occStartWallClock : dayjs.tz(occStartWallClock, tzid).toISOString();
        const occEndOut = isAllDay ? occEndWallClock : dayjs.tz(occEndWallClock, tzid).toISOString();

        return {
            ...event,
            id: `${event.id}::occ${occStart.getTime()}`,
            start: occStartOut,
            end: occEndOut,
            recurrence: undefined,
            // persistEventMove (utils/persistEventMove.ts) decides whether a
            // drag/resize should exclude-and-recreate (vs. a plain update)
            // entirely from event.recurringInstance?.isRecurringInstance --
            // metadata that used to come from Mantine itself, back when
            // Mantine was the one expanding this occurrence. Now that we
            // pre-expand it ourselves and strip `recurrence` above (so
            // Mantine treats this as an ordinary event), Mantine has no
            // reason to attach that metadata anymore. Without supplying it
            // ourselves, persistEventMove falls through to
            // updateEvent({ id: Number("123::occ...") }) -- NaN. This
            // reconstructs the same shape Mantine used to provide.
            //
            // recurrenceId is ALWAYS the wall-clock-in-tzid form
            // (occStartWallClock), for both all-day and timed events --
            // exclude_event_occurrence (Flask) does zero parsing of
            // occurrenceStart, it just string-appends it to event.exdate,
            // and the exdate-parsing branch above expects exactly this
            // form back. Using occStartOut here instead (a real UTC-Z
            // instant for a timed event) would still "work" today only
            // because nothing validates it -- but it wouldn't round-trip
            // through wallClockToRRuleDate the same way dtstart does, so
            // excluding a timed occurrence would silently fail to match.
            recurringInstance: {
                isRecurringInstance: true,
                recurringEventId: event.id,
                recurrenceId: occStartWallClock,
            },
        } as unknown as ScheduleEventData;
    });
}

/** Pre-expands every recurring event in `events` into concrete occurrences
 * overlapping [rangeStart, rangeEnd], so Week/Month/Agenda view never hand
 * Mantine a `recurrence` field. Mantine's own internal recurrence expansion
 * has the identical DST bug expandRecurringOccurrencesInRange works around
 * above -- it isn't something we can configure our way out of, since it
 * happens inside the library, so the only fix is to never let Mantine
 * compute an occurrence date itself. Non-recurring events pass through
 * unchanged. */
export function toRangeEvents(
    events: ScheduleEventData[],
    rangeStart: string,
    rangeEnd: string
): ScheduleEventData[] {
    return events.flatMap((event) => expandRecurringOccurrencesInRange(event, rangeStart, rangeEnd));
}

/** Day view needs one event-segment per day a multi-day occurrence spans
 * (see splitEventIntoDaySegments above), so on top of expanding occurrence
 * dates it also has to know exactly which occurrence(s) overlap the single
 * visible day, then hand each one through the day-splitter. */
function expandRecurringOccurrencesForDay(event: ScheduleEventData, visibleDate: string): ScheduleEventData[] {
    const payload = event.payload as EventColorPayload | undefined;
    const day = dayjs(visibleDate);
    const dayStart = day.startOf("day");
    const dayEnd = day.endOf("day");

    return expandRecurringOccurrencesInRange(event, visibleDate, visibleDate).flatMap((occurrenceEvent) => {
        const occStartLocal = dayjs(occurrenceEvent.start as string);
        const occEndLocal = dayjs(occurrenceEvent.end as string);
        const overlapsVisibleDay = !occEndLocal.isBefore(dayStart) && !occStartLocal.isAfter(dayEnd);
        if (!overlapsVisibleDay) return [];

        return splitEventIntoDaySegments(occurrenceEvent, payload);
    });
}

export function toDayViewEvents(events: ScheduleEventData[], visibleDate: string): ScheduleEventData[] {
    return events.flatMap((event) => {
        if (event.recurrence) return expandRecurringOccurrencesForDay(event, visibleDate);
        return splitEventIntoDaySegments(event, event.payload as EventColorPayload | undefined);
    });
}

export function toLightCssColor(color: string): string {
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
        return `color-mix(in oklab, ${color}, white 78%)`;
    }
    return `var(--mantine-color-${color}-1)`;
}

export function toDotCssColor(color: string): string {
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
        return color;
    }
    return `var(--mantine-color-${color}-6)`;
}

/** The inline style toMemberColorStripe hands FullPageCalendar for one
 * day's button - see that function's comment for why every one of these
 * four properties has to be set together, in JS, rather than split
 * between a single JS value and an external CSS rule. */
export type MemberColorStripeStyle = {
    backgroundImage: string;
    backgroundSize: string;
    backgroundPosition: string;
    backgroundRepeat: string;
};

/**
 * Builds the background-* style for MobileMonthView's day-cell indicator:
 * one capsule ("pill") per day - flat sides, fully round ends - with its
 * interior divided into one color segment per distinct attendee that day
 * (see FullPageCalendar's getMobileDayProps).
 *
 * Three designs tried before this one. Per-member DOTs (one small circle
 * per attendee, up to 8 - TOBY's max household size) fought the available
 * space two ways: drawing them via ::before/::after + box-shadow collided
 * with Mantine's own use of one of the day button's two pseudo-element
 * slots for its today/selected circle (confirmed via DevTools: the
 * button's own border-radius computes to 0, so that highlight has to come
 * from a pseudo-element); and even once moved to background-image to
 * dodge that collision, a circle small enough to fit 8 in one cell read
 * as barely-there on an actual phone. A single-gradient STRIPE fixed the
 * collision (background-image only, no pseudo-elements) and gave each
 * person more visible area, but with no separation between people's
 * segments it read as "one smeared bar." Adding transparent gaps between
 * segments fixed that, but every segment still had square corners -
 * individually ROUNDING each one (one background-image layer per person,
 * each an ellipse) fixed that too, but only approximately - an ellipse
 * inscribed in a wide short box curves continuously across its whole
 * width rather than having true flat sides, which is what actually
 * prompted this round: once there were several of these "chips" sitting
 * side by side, the continuous curve read as a row of ovals rather than
 * one coherent rounded bar.
 *
 * This version is a true stadium shape - the same two problems a circle
 * has (too little height budget to also be legible) still rule out going
 * back to round dots, but a PILL isn't round: its ends are semicircles,
 * capped at a fixed height, while its body is flat-sided and stretches to
 * use whatever width the day actually needs - all the same "flexible
 * width, fixed height" reasoning that made the chips legible in the first
 * place, just assembled as one continuous bar instead of N independently-
 * shaped ones, and at a taller height than the earlier rounds (10px, up
 * from 5px) for more visual presence.
 *
 * Per-person segments sit flush against each other now - no transparent
 * gap between them (the chips/gap-stripe rounds had one, to keep
 * same-day people visually distinct; removed this round in favor of one
 * unbroken bar).
 *
 * Built from exactly 3 background-image layers, every day regardless of
 * how many colors there are - not one per person:
 *   1. A left end cap: a true circle (radius = half the bar's height),
 *      positioned with its OWN LEFT edge at the day button's left inset.
 *   2. A right end cap: the same circle, mirrored to the right inset.
 *   3. A flat, segmented middle: one linear-gradient with a hard color
 *      stop per person (no gap between them - see above), sized to span
 *      exactly from the left cap's CENTER to the right cap's CENTER - not
 *      edge to edge.
 * That "starts exactly at the cap's center" detail is what makes the
 * join seamless rather than approximate: a plain rectangle has full
 * height at every x position along its own width, including the very
 * first column at the cap's center - so from that point outward, the
 * rectangle alone already draws the complete flat edge, with no taper.
 * The cap's circle still extends a bit further right than that (to its
 * own far edge), overlapping the rectangle's first sliver - but since
 * that overlap is always the SAME color on both layers (the rectangle's
 * own first color stop is the same as the cap's color), it's invisible:
 * two opaque layers painting identical pixels, not a seam. Left of the
 * center, only the cap's circle exists at all, which is exactly the
 * semicircle a true pill's end is supposed to be.
 *
 * The two caps are positioned with CSS's edge-offset position syntax
 * (`left <offset> bottom`, `right <offset> bottom`) rather than the
 * percentage-math the earlier per-chip version needed - that syntax
 * means "this layer's own edge sits exactly `<offset>` from the
 * container's matching edge," which is directly the number we want, no
 * solving an inverse percentage equation required. The middle layer's
 * position mixes a percent and a pixel length in one `calc()` (the day
 * button's own left inset, plus the cap's fixed pixel radius) - perfectly
 * normal for a CSS position value, and simpler than keeping the inset and
 * every segment's offset in one unbroken percent scale the way the chips
 * version had to.
 *
 * Returns undefined for an empty color list, so a day with nothing to
 * show gets no background at all.
 */
export function toMemberColorStripe(colors: string[]): MemberColorStripeStyle | undefined {
    if (colors.length === 0) return undefined;

    // Also each end cap's diameter - their radius (half of this) is what
    // the middle rectangle's own start position is offset by, below.
    const chipHeight = 10;
    const capRadius = chipHeight / 2;
    // Percent of the day button's own width reserved on each side, so
    // neighboring days' pills never touch.
    const inset = 3;

    const firstColor = toDotCssColor(colors[0]);
    const lastColor = toDotCssColor(colors[colors.length - 1]);

    // Flush hard-stop segments, relative to the MIDDLE layer's own local
    // 0%-100% box (which excludes both end caps entirely, rather than
    // the whole day button) - no transparent gap between people this
    // round, so the bar reads as one unbroken bar rather than separated
    // sections.
    const segmentPercent = 100 / colors.length;
    const stops: string[] = [];
    let cursor = 0;
    for (const color of colors) {
        const cssColor = toDotCssColor(color);
        const segmentEnd = cursor + segmentPercent;
        stops.push(`${cssColor} ${cursor}%`, `${cssColor} ${segmentEnd}%`);
        cursor = segmentEnd;
    }
    const middleGradient = `linear-gradient(to right, ${stops.join(", ")})`;

    return {
        backgroundImage: [
            `radial-gradient(circle closest-side at center, ${firstColor} 100%, transparent 100%)`,
            `radial-gradient(circle closest-side at center, ${lastColor} 100%, transparent 100%)`,
            middleGradient,
        ].join(", "),
        backgroundSize: [
            `${chipHeight}px ${chipHeight}px`,
            `${chipHeight}px ${chipHeight}px`,
            `calc(${100 - inset * 2}% - ${chipHeight}px) ${chipHeight}px`,
        ].join(", "),
        backgroundPosition: [
            `left ${inset}% bottom`,
            `right ${inset}% bottom`,
            `left calc(${inset}% + ${capRadius}px) bottom`,
        ].join(", "),
        backgroundRepeat: "no-repeat",
    };
}

function toTextCssColor(color: string): string {
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
        return `color-mix(in oklab, ${color}, black 15%)`;
    }
    return `var(--mantine-color-${color}-9)`;
}

export function getEventTextColor(colors: string[]): string {
    if (colors.length <= 1) return toTextCssColor(colors[0] ?? "blue");
    return "var(--mantine-color-dark-7)";
}