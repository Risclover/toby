import { type ComponentType, useState } from "react";
import { type ScheduleViewLevel } from "@mantine/schedule";

import { CalendarProvider } from "@/contexts";
import { AgendaModal } from "./AgendaModal";
import { CalendarDayView } from "./CalendarDayView";
import { CalendarModals } from "./CalendarModals";
import { CalendarMobileMonthView } from "./CalendarMobileMonthView";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarToolbar } from "./CalendarToolbar";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarYearView } from "./CalendarYearView";
import { useIsSmallScreen } from "@/hooks";
import { useScrollToTopOnChange } from "../../hooks";
import { MOBILE_BREAKPOINT, toDateString, type CalendarViewProps } from "../../utils";

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