import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useHousehold } from "@/hooks";
import { useGetAllHouseholdEventsQuery } from "@/store";
import { type HouseholdMemberColor } from "@/features/Events/utils/getEventColors";
import { useMemberFilter } from "@/features/Events/hooks/useMemberFilter";
import { useScheduleEvents } from "@/features/Events/hooks/useScheduleEvents";
import { useAgendaModal } from "@/features/Events/hooks/useAgendaModal";
import { type ScheduleViewLevel } from "@mantine/schedule";

const EMPTY_MEMBERS: HouseholdMemberColor[] = [];

type CalendarContextValue = {
    householdId: number | undefined;
    members: HouseholdMemberColor[];
    memberFilter: ReturnType<typeof useMemberFilter>;
    events: ReturnType<typeof useScheduleEvents>;
    agenda: ReturnType<typeof useAgendaModal>;
    modals: ReturnType<typeof useEventModals>;
    moveEvent: ReturnType<typeof useEventMove>;
};

type CalendarProviderProps = {
    view: ScheduleViewLevel;
    children: ReactNode;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export const CalendarProvider = ({ view, children }: CalendarProviderProps) => {
    const { data: household } = useHousehold();
    const { data: householdEvents } = useGetAllHouseholdEventsQuery({ householdId: household?.id });

    const members: HouseholdMemberColor[] = household?.members ?? EMPTY_MEMBERS;
    const memberIds = useMemo(() => members.map(({ id }) => id), [members]);

    const memberFilter = useMemberFilter({ memberIds });
    const events = useScheduleEvents({
        events: householdEvents,
        members,
        memberIds,
        selectedIds: memberFilter.selectedIds,
    });
    const agenda = useAgendaModal({ view });
    const modals = useEventModals({ agenda, visibleEvents: events.visibleEvents, members });
    const moveEvent = useEventMove({ householdId: household?.id, visibleEvents: events.visibleEvents });

    const value: CalendarContextValue = {
        householdId: household?.id,
        members,
        memberFilter,
        events,
        agenda,
        modals,
        moveEvent,
    };

    return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (!context) throw new Error("useCalendar must be used within a CalendarProvider");
    return context;
};