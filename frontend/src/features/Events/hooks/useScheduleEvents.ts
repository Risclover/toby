import { useMemo } from "react";
import type { CalendarEvent } from "@/store";
import { toScheduleEvent, type HouseholdMemberColor } from "../utils/getEventColors";

type UseScheduleEventsProps = {
    events: CalendarEvent[] | undefined;
    members: HouseholdMemberColor[];
    memberIds: number[];
    selectedIds: number[];
};

const getAttendeeIds = (event: CalendarEvent, memberIds: number[]) =>
    event.allMembers ? memberIds : event.attendeeIds ?? [];

export const useScheduleEvents = ({ events, members, memberIds, selectedIds }: UseScheduleEventsProps) => {
    const visibleEvents = useMemo(
        () =>
            (events ?? []).filter((event) =>
                getAttendeeIds(event, memberIds).some((id) => selectedIds.includes(id))
            ),
        [events, memberIds, selectedIds]
    );

    const scheduleEvents = visibleEvents.map((event) => toScheduleEvent(event, members));

    return { visibleEvents, scheduleEvents };
};