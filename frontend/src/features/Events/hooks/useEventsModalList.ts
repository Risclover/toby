import { useState } from "react";
import { useClickOutside } from "@mantine/hooks";

import { useDayEvents } from "./useDayEvents";
import { useHousehold, useIsMobile } from "@/hooks";
import { useAuthenticateQuery, type CalendarEvent } from "@/store";
import type { DayEventRowSharedProps } from "../types";
import { EVENTS_FILTER, getMemberOccurrences, groupOccurrencesByMember } from "../utils";

export type UseEventsModalListProps = {
    householdId: number;
    date: Date;
    filterValue: string | null;
    onEditEvent: (event: CalendarEvent) => void;
};

export function useEventsModalList({
    householdId,
    date,
    filterValue,
    onEditEvent,
}: UseEventsModalListProps) {
    const { occurrences, isLoading } = useDayEvents({ householdId, date });
    const { data: currentUser } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const isMobile = useIsMobile();
    const [openDotId, setOpenDotId] = useState<string | null>(null);

    useClickOutside(() => setOpenDotId(null), null, [], isMobile);

    const rowProps: DayEventRowSharedProps = {
        onEdit: onEditEvent,
        openDotId,
        onOpenDot: setOpenDotId,
    };

    const isGrouped = filterValue === EVENTS_FILTER.GROUP_BY_USER;
    const isMineOnly = filterValue === EVENTS_FILTER.MINE_ONLY && Boolean(currentUser);

    const groups = isGrouped
        ? groupOccurrencesByMember({ occurrences, household, currentUserId: currentUser?.id })
        : [];

    const visibleOccurrences = isMineOnly && currentUser
        ? getMemberOccurrences({ occurrences, household, memberId: currentUser.id })
        : occurrences;

    return {
        isLoading,
        isGrouped,
        groups,
        visibleOccurrences,
        currentUserId: currentUser?.id,
        rowProps,
    };
}