import { type ComponentType, useState } from "react";

import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";


import { AgendaModal } from "./AgendaModal";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarModals } from "./CalendarModals";
import { CalendarMobileMonthView } from "./CalendarMobileMonthView";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarProvider } from "@/contexts";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarYearView } from "./CalendarYearView";
import { type ScheduleViewLevel } from "@mantine/schedule";
import { MOBILE_BREAKPOINT, toDateString, type CalendarViewProps } from "../../utils";
import { useScrollToTopOnChange } from "../../hooks/useScrollToTopOnChange";

const INITIAL_VIEW: ScheduleViewLevel = "week";

const VIEW_COMPONENTS: Record<ScheduleViewLevel, ComponentType<CalendarViewProps>> = {
    day: CalendarDayView,
    week: CalendarWeekView,
    month: CalendarMonthView,
    year: CalendarYearView,
};

export function FullPageCalendar() {
    const [date, setDate] = useState(() => toDateString());
    const [view, setView] = useState<ScheduleViewLevel>(INITIAL_VIEW);
    const isSmallScreen = useIsSmallScreen(MOBILE_BREAKPOINT);

    useScrollToTopOnChange(view);

    const ActiveView = VIEW_COMPONENTS[view];

    return (
        <CalendarProvider view={view}>
            {isSmallScreen ? (
                <>
                    <CalendarModals date={date} />
                    <CalendarMobileMonthView date={date} onDateChange={setDate} />
                </>
            ) : (
                <>
                    <AgendaModal />
                    <CalendarModals date={date} />
                    <CalendarToolbar date={date} />
                    <ActiveView date={date} onDateChange={setDate} onViewChange={setView} />
                </>
            )}
        </CalendarProvider>
    );
}