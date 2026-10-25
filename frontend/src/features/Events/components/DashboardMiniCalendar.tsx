import { Group, Text } from "@mantine/core";
import { MiniCalendar } from "@mantine/dates";
import { useCalendar } from "@/contexts";
import { MINI_CALENDAR_DAYS, useMiniCalendarWeek } from "../hooks/useMiniCalendarWeek";
import { useMiniCalendarDots } from "../hooks/useMiniCalendarDots";
import { getDayDots, toYmd } from "../utils/dashboardCalendarHelpers";
import "../styles/QuickAddEvent.css";
import "../styles/DashboardMiniCalendar.css";

const TODAY_BACKGROUND = "#f1f1ff";

/** Homepage week strip. Clicking a day opens the calendar's agenda modal for that day. */
export function DashboardMiniCalendar() {
    const { agenda } = useCalendar();
    const { startDate, headerTitle, goPrev, goNext } = useMiniCalendarWeek();
    const dayDots = useMiniCalendarDots({ startDate, numberOfDays: MINI_CALENDAR_DAYS });

    const todayYmd = toYmd(new Date());

    return (
        <div className="events-calendar">
            {/* Centered dominant-month title; MiniCalendar keeps its own arrows */}
            <Group justify="center" className="events-calendar-header">
                <Text fw={500} fz="lg" className="events-header-title">{headerTitle}</Text>
            </Group>

            <MiniCalendar
                styles={{
                    root: { color: "black", fontSize: "var(--text-base)" },
                    days: { gap: "0.25rem" },
                }}
                date={startDate}
                numberOfDays={MINI_CALENDAR_DAYS}
                monthLabelFormat="ddd" // Sun, Mon, Tue, ...
                onPrevious={goPrev}    // keep header in sync with built-in arrows
                onNext={goNext}
                // Do NOT use onChange/onDateChange for opening the modal (arrows trigger them).
                getDayProps={(ymd) => {
                    const { hasDots, hasOverflow, overflowCount, cssVars } = getDayDots(dayDots[ymd] ?? []);
                    const hasEvents = hasDots || hasOverflow;

                    return {
                        "data-testid": `cal-day-${ymd}`,
                        "data-has-events": hasEvents,
                        ...(hasOverflow ? { "data-overflow": `+${overflowCount}` } : {}),
                        className: hasEvents ? "mc-has-events" : "mc-no-events",
                        style: { background: ymd === todayYmd ? TODAY_BACKGROUND : undefined, ...cssVars },
                        title: hasEvents ? "Has events" : undefined,
                        onClick: () => agenda.openForDay(ymd),
                    };
                }}
            />
        </div>
    );
}