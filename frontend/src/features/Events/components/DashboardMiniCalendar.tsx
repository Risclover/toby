import { useState } from "react";
import { Group, Text, useModalsStack } from "@mantine/core";
import { MiniCalendar } from "@mantine/dates";

import { EventForm } from "./EventForm/EventForm";
import { DayEventsModal } from "./EventsModal/DayEventsModal";
import { MINI_CALENDAR_DAYS, useMiniCalendarWeek, useMiniCalendarDots } from "../hooks";
import type { CalendarEvent } from "@/store";
import { dateFromYmd, getDayDots, toYmd } from "../utils";
import type { ModalId } from "../types";
import "../styles/QuickAddEvent.css";
import "../styles/DashboardMiniCalendar.css";

type NavigableScreen = Exclude<ModalId, "recurrence">;

const TODAY_BACKGROUND = "#f1f1ff";

type Props = {
    householdId: number;
};

export function DashboardMiniCalendar({ householdId }: Props) {
    const stack = useModalsStack(["events-list", "recurrence", "event-form"]);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showAddEvent, setShowAddEvent] = useState(false);

    const { startDate, headerTitle, goPrev, goNext } = useMiniCalendarWeek();
    const dayDots = useMiniCalendarDots({ householdId, startDate, numberOfDays: MINI_CALENDAR_DAYS });

    const todayYmd = toYmd(new Date());

    const navigateTo = (screen: NavigableScreen, eventToEdit?: CalendarEvent) => {
        setEditingEvent(eventToEdit);
        setShowAddEvent(screen === "event-form");
        stack.close(screen === "event-form" ? "events-list" : "event-form");
        stack.open(screen);
    };

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
                    const { hasDots, hasOverflow, overflowCount, cssVars } = getDayDots(dayDots.get(ymd) ?? []);
                    const hasEvents = hasDots || hasOverflow;

                    return {
                        "data-testid": `cal-day-${ymd}`,
                        "data-has-events": hasEvents,
                        ...(hasOverflow ? { "data-overflow": `+${overflowCount}` } : {}),
                        className: hasEvents ? "mc-has-events" : "mc-no-events",
                        style: { background: ymd === todayYmd ? TODAY_BACKGROUND : undefined, ...cssVars },
                        title: hasEvents ? "Has events" : undefined,
                        onClick: () => {
                            setSelectedDate(dateFromYmd(ymd));
                            stack.open("events-list");
                        },
                    };
                }}
            />

            <DayEventsModal
                householdId={householdId}
                date={selectedDate}
                setSelectedDate={setSelectedDate}
                stack={stack}
                onAddEvent={() => navigateTo("event-form")}
                onEditEvent={(event) => navigateTo("event-form", event)}
            />
            <EventForm
                householdId={householdId}
                opened={showAddEvent}
                initialDate={selectedDate}
                onClose={() => navigateTo("events-list")}
                edit={Boolean(editingEvent)}
                event={editingEvent}
                stack={stack}
            />
        </div>
    );
}