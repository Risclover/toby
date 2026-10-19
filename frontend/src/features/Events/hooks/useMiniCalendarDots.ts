import { useMemo } from "react";
import { expandRecurringEvents } from "@mantine/schedule";
import { useAuthenticateQuery, useGetAllHouseholdEventsQuery, type User } from "@/store";
import {
    addDaysYmd,
    expandWallClockSpanToDays,
    normalizeWallClock,
    toWallClockScheduleEvents,
    toYmd,
    type EventPayload
} from "../utils";

type Params = {
    householdId: number;
    startDate: Date;
    numberOfDays: number;
};

type DotOwner = Pick<User, "id" | "color">;

/** Who gets a dot for this event: every attendee if public, only me if it's a private event of mine. */
const getDotOwners = (payload: EventPayload, user: User | undefined): DotOwner[] => {
    const attendees = payload.attendees ?? [];
    if (payload.visibility === "public") return attendees;
    if (payload.visibility === "private" && user) {
        const isMine = payload.creatorId === user.id || attendees.some((a) => a.id === user.id);
        return isMine ? [user] : [];
    }
    return [];
};

/** "YYYY-MM-DD" -> one dot color per person with an event that day, for the visible window. */
export const useMiniCalendarDots = ({ householdId, startDate, numberOfDays }: Params): Map<string, string[]> => {
    const { data: allEvents } = useGetAllHouseholdEventsQuery({ householdId }, { skip: !householdId });
    const { data: user } = useAuthenticateQuery();

    const scheduleEvents = useMemo(() => toWallClockScheduleEvents(allEvents ?? []), [allEvents]);

    return useMemo(() => {
        const colorsByDay = new Map<string, Map<number, string>>(); // ymd -> (userId -> color)

        const addColor = (ymd: string, owner: DotOwner) => {
            if (!owner.color) return;
            let dayColors = colorsByDay.get(ymd);
            if (!dayColors) colorsByDay.set(ymd, (dayColors = new Map()));
            if (!dayColors.has(owner.id)) dayColors.set(owner.id, owner.color);
        };

        const firstDay = toYmd(startDate);
        const windowStart = `${firstDay} 00:00:00`;
        const windowEnd = `${addDaysYmd(firstDay, numberOfDays - 1)} 23:59:59`;

        // expandRecurringEvents can return occurrences that spill outside the
        // requested range for recurring events (confirmed while debugging the
        // events-list modal double-listing bug) - re-check actual overlap
        // ourselves rather than trusting its range filtering.
        const occurrences = expandRecurringEvents({
            events: scheduleEvents,
            rangeStart: windowStart,
            rangeEnd: windowEnd,
        })
            .map((occ) => ({ ...occ, start: normalizeWallClock(occ.start), end: normalizeWallClock(occ.end) }))
            .filter((occ) => occ.start <= windowEnd && occ.end > windowStart);

        for (const occ of occurrences) {
            const payload = occ.payload as EventPayload | undefined;
            if (!payload) continue;

            const owners = getDotOwners(payload, user);
            for (const day of expandWallClockSpanToDays(occ.start, occ.end)) {
                owners.forEach((owner) => addColor(day, owner));
            }
        }

        const dotsByDay = new Map<string, string[]>();
        colorsByDay.forEach((dayColors, ymd) => dotsByDay.set(ymd, Array.from(dayColors.values())));
        return dotsByDay;
    }, [scheduleEvents, user, startDate, numberOfDays]);
};