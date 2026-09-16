import type { ComponentProps } from "react";
import { Schedule, DayView, MobileMonthView, AgendaView } from "@mantine/schedule";
import { Modal, Button, Group, Text, UnstyledButton } from "@mantine/core";
import "../../styles/CalendarPage.css";
import {
    useGetAllHouseholdEventsQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useExcludeEventOccurrenceMutation,
} from "@/store";
import { useHousehold, useIsSmallScreen } from "@/hooks";
import dayjs from "dayjs";
import { useState } from "react";
import { renderEventBody } from "../../utils/multiColorScheduleProps";
import {
    toScheduleEvent,
    toMobileMonthEvents,
    toDayViewEvents,
    toDotCssColor,
    getEventTextColor,
    type EventColorPayload,
} from "../../utils/getEventColors";
import { renderMobileMonthEvent } from "../../utils/mobileMonthEventRender";
import { persistEventMove } from "../../utils/persistEventMove";
import { EventMemberDots } from "./EventColorDots";
import { ButtonStandard } from "@/components/ButtonStandard";

type ScheduleViewLevel = NonNullable<ComponentProps<typeof Schedule>["view"]>;
type AgendaRenderEvent = NonNullable<ComponentProps<typeof AgendaView>["renderEvent"]>;

const canInteractWithEvent = (event: { payload?: unknown }) =>
    !(event.payload as EventColorPayload | undefined)?.isDayViewContinuation;

/**
 * The built-in `withAgenda` button (on DayView/WeekView/MonthView/Schedule)
 * opens an internal AgendaView instance with no prop passthrough into it --
 * there's no `agendaViewProps` the way there's `dayViewProps`/`weekViewProps`.
 * So to show the full "Sep 8, 16:00 - Sep 10, 15:00" range for a multi-day
 * event instead of the per-day time AgendaView defaults to, we render our
 * own standalone <AgendaView> with a custom renderEvent, triggered by our
 * own button, instead of `withAgenda`.
 */
const renderAgendaEvent: AgendaRenderEvent = (event, props) => {
    const payload = event.payload as EventColorPayload | undefined;
    const colors = payload?.colors ?? [event.color];
    const start = dayjs(event.start);
    const end = dayjs(event.end);
    const isMultiDay = !start.isSame(end, "day");

    const timeLabel = payload?.hasTime === false
        ? (isMultiDay ? `${start.format("MMM D")} \u2013 ${end.format("MMM D")}` : "All day")
        : isMultiDay
            ? `${start.format("MMM D, H:mm")} \u2013 ${end.format("MMM D, H:mm")}`
            : `${start.format("H:mm")} \u2013 ${end.format("H:mm")}`;

    return (
        <UnstyledButton {...props} style={{ width: "100%", padding: "8px 4px" }}>
            <Group gap={8} wrap="nowrap" align="flex-start">
                {colors.length > 1 ? (
                    <EventMemberDots colors={colors} />
                ) : (
                    <div
                        style={{
                            width: 4,
                            alignSelf: "stretch",
                            borderRadius: 2,
                            background: toDotCssColor(colors[0] ?? "blue"),
                        }}
                    />
                )}
                <div>
                    <Text fz={14} fw={500} style={{ color: getEventTextColor(colors) }}>
                        {event.title}
                    </Text>
                    <Text fz={12} c="dimmed">{timeLabel}</Text>
                </div>
            </Group>
        </UnstyledButton>
    );
};

export const FullPageCalendar = () => {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [view, setView] = useState<ScheduleViewLevel>("week");
    const [agendaOpen, setAgendaOpen] = useState(false);
    const { data: household } = useHousehold();
    const { data: events } = useGetAllHouseholdEventsQuery({ householdId: household?.id });

    const [createEvent] = useCreateEventMutation();
    const [updateEvent] = useUpdateEventMutation();
    const [excludeEventOccurrence] = useExcludeEventOccurrenceMutation();

    const isSmallScreen = useIsSmallScreen(768);

    const scheduleEvents = events?.map((event) => toScheduleEvent(event, household?.members ?? []));
    const mobileEvents = events?.flatMap((event) => toMobileMonthEvents(event, household?.members ?? []));
    const dayViewEvents = scheduleEvents ? toDayViewEvents(scheduleEvents) : [];

    const handleEventMove = async (data: any) => {
        console.log("drop data:", JSON.stringify(data, null, 2));
        if (!household?.id) return;
        try {
            await persistEventMove(data, {
                householdId: household.id,
                updateEvent,
                createEvent,
                excludeEventOccurrence,
            });
        } catch (e) {
            console.error(e);
        }
    };

    // AgendaView's range for whichever view is currently active. Assumes
    // dayjs's default week boundaries match what WeekView itself uses --
    // worth double-checking if the app ever sets a non-default
    // firstDayOfWeek somewhere else, since nothing here currently does.
    const agendaRange = (() => {
        const d = dayjs(date);
        if (view === "day") return { start: d.format("YYYY-MM-DD"), end: d.format("YYYY-MM-DD") };
        if (view === "week") return { start: d.startOf("week").format("YYYY-MM-DD"), end: d.endOf("week").format("YYYY-MM-DD") };
        return { start: d.startOf("month").format("YYYY-MM-DD"), end: d.endOf("month").format("YYYY-MM-DD") };
    })();

    if (isSmallScreen) {
        return (
            <MobileMonthView
                date={date}
                onDateChange={setDate}
                events={mobileEvents ?? []}
                renderEvent={renderMobileMonthEvent}
            />
        );
    }

    const agendaModal = (
        <Modal opened={agendaOpen} onClose={() => setAgendaOpen(false)} title="Agenda" size="lg">
            <AgendaView
                rangeStart={agendaRange.start}
                rangeEnd={agendaRange.end}
                events={scheduleEvents ?? []}
                renderEvent={renderAgendaEvent}
            />
        </Modal>
    );

    if (view === "day") {
        return (
            <>
                {agendaModal}
                <Group justify="flex-end" mb="xs">
                    <ButtonStandard label="Agenda" variant="filled" onClick={() => setAgendaOpen(true)} />
                </Group>
                <DayView
                    date={date}
                    onDateChange={setDate}
                    onViewChange={setView}
                    events={dayViewEvents}
                    withAllDaySlot
                    withEventsDragAndDrop
                    withEventResize
                    canDragEvent={canInteractWithEvent}
                    canResizeEvent={canInteractWithEvent}
                    onEventDrop={handleEventMove}
                    onEventResize={handleEventMove}
                    renderEventBody={renderEventBody}
                />
            </>
        );
    }

    return (
        <>
            {agendaModal}
            <Group justify="flex-end" mb="xs">
                <ButtonStandard label="Agenda" variant="filled" onClick={() => setAgendaOpen(true)} />
            </Group>
            <Schedule
                date={date}
                onDateChange={setDate}
                view={view}
                onViewChange={setView}
                events={scheduleEvents}
                withEventsDragAndDrop
                withEventResize
                onEventDrop={handleEventMove}
                onEventResize={handleEventMove}
                monthViewProps={{ maxEventsPerDay: 10 }}
                dayViewProps={{ withAllDaySlot: true }}
                weekViewProps={{ withAllDaySlots: true }}
                renderEventBody={renderEventBody}
            />
        </>
    );
}