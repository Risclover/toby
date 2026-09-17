import type { ComponentProps } from "react";
import { Schedule, DayView, WeekView, MonthView, MobileMonthView, AgendaView } from "@mantine/schedule";
import { Modal, Button, ActionIcon, Group, Stack, Text, UnstyledButton, useModalsStack } from "@mantine/core";
import "../../styles/CalendarPage.css";
import {
    useGetAllHouseholdEventsQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useExcludeEventOccurrenceMutation,
    type CalendarEvent,
} from "@/store";
import { useHousehold, useIsSmallScreen } from "@/hooks";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { renderEventBody } from "../../utils/multiColorScheduleProps";
import {
    toScheduleEvent,
    toMobileMonthEvents,
    toDayViewEvents,
    type EventColorPayload,
} from "../../utils/getEventColors";
import { formatEventDate, formatEventDateTime, formatAgendaHeaderDate } from "../../utils/formatEventDate";
import { EventMemberDots } from "../../components/CalendarPage/EventColorDots";
import { MemberFilterRow } from "../../components/CalendarPage/MemberFilterRow";
import { renderMobileMonthEvent } from "../../utils/mobileMonthEventRender";
import { persistEventMove } from "../../utils/persistEventMove";
import { EventDetailsModal } from "./EventDetailsModal";
import { EventActionsMenu } from "./EventActionsMenu";
import type { ModalId } from "../../types";
import { EventForm, TIME_FORMAT } from "../EventForm/EventForm";


type ScheduleViewLevel = NonNullable<ComponentProps<typeof Schedule>["view"]>;
type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];
type AgendaRenderEvent = NonNullable<ComponentProps<typeof AgendaView>["renderEvent"]>;
type WeekRenderEvent = NonNullable<ComponentProps<typeof WeekView>["renderEvent"]>;

type SlotRange = { start: string; end: string };

const canInteractWithEvent = (event: { payload?: unknown }) =>
    !(event.payload as EventColorPayload | undefined)?.isDayViewContinuation;

export const FullPageCalendar = () => {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [view, setView] = useState<ScheduleViewLevel>("week");
    const [agendaOpen, setAgendaOpen] = useState(false);
    const [agendaAnchorDate, setAgendaAnchorDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[] | null>(null);
    const [draggingEventId, setDraggingEventId] = useState<string | number | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ScheduleEventData | null>(null);
    const [detailsOpened, setDetailsOpened] = useState(false);
    const [formOpened, setFormOpened] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
    const [slotRange, setSlotRange] = useState<SlotRange | null>(null);
    const [allDayTargetDate, setAllDayTargetDate] = useState<string | null>(null);
    const [returnModal, setReturnModal] = useState<"agenda" | "details" | null>(null);
    const stack = useModalsStack<ModalId>(['recurrence', 'event-form']);

    const { data: household } = useHousehold();
    const { data: events } = useGetAllHouseholdEventsQuery({ householdId: household?.id });

    const [createEvent] = useCreateEventMutation();
    const [updateEvent] = useUpdateEventMutation();
    const [excludeEventOccurrence] = useExcludeEventOccurrenceMutation();

    const isSmallScreen = useIsSmallScreen(768);

    const allMemberIds = useMemo(
        () => household?.members?.map((m: { id: number }) => m.id) ?? [],
        [household]
    );
    const effectiveSelectedIds = selectedMemberIds ?? allMemberIds;

    const handleToggleMember = (id: number) => {
        setSelectedMemberIds((current) => {
            const base = current ?? allMemberIds;
            return base.includes(id) ? base.filter((memberId) => memberId !== id) : [...base, id];
        });
    };

    const visibleEvents = useMemo(() => {
        if (!events) return events;
        return events.filter((event) => {
            const attendeeIds = event.allMembers ? allMemberIds : event.attendeeIds ?? [];
            return attendeeIds.some((id) => effectiveSelectedIds.includes(id));
        });
    }, [events, allMemberIds, effectiveSelectedIds]);

    const scheduleEvents = visibleEvents?.map((event) => toScheduleEvent(event, household?.members ?? []));
    const mobileEvents = visibleEvents?.flatMap((event) => toMobileMonthEvents(event, household?.members ?? []));
    const dayViewEvents = scheduleEvents ? toDayViewEvents(scheduleEvents) : [];

    const liveEvent = useMemo(() => {
        if (!selectedEvent) return null;
        const recurringInstance = (selectedEvent as any).recurringInstance as { recurringEventId?: string | number } | undefined;
        const masterId = recurringInstance?.recurringEventId ?? selectedEvent.id;
        const freshSource = visibleEvents?.find((e) => String(e.id) === String(masterId));
        if (!freshSource) return null;

        const fresh = toScheduleEvent(freshSource, household?.members ?? []);
        return {
            ...selectedEvent,
            color: fresh.color,
            payload: fresh.payload,
        };
    }, [selectedEvent, visibleEvents, household]);

    useEffect(() => {
        if (detailsOpened && selectedEvent && !liveEvent) {
            setDetailsOpened(false);
        }
    }, [detailsOpened, selectedEvent, liveEvent]);

    // Reset scroll to the top whenever the calendar switches views (e.g.
    // clicking a day in Month view drops you into Day view) so you don't
    // land mid-page in the new view.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [view]);

    const handleEventMove = async (data: any) => {
        if (!household?.id) return;
        const sourceEvent = visibleEvents?.find((e) => e.id === data.eventId);
        try {
            await persistEventMove(
                {
                    ...data,
                    event: {
                        ...data.event,
                        payload: {
                            ...data.event?.payload,
                            hasTime: sourceEvent?.hasTime ?? data.event?.payload?.hasTime,
                            tzid: sourceEvent?.tzid ?? data.event?.payload?.tzid,
                        },
                    },
                },
                {
                    householdId: household.id,
                    updateEvent,
                    createEvent,
                    excludeEventOccurrence,
                }
            );
        } catch (e) {
            console.error(e);
        }
    };

    const handleEventClick = (event: ScheduleEventData) => {
        setSelectedEvent(event);
        setDetailsOpened(true);
    };

    // Shared by EventDetailsModal's menu and the agenda row's menu. Remembers
    // which of the two was actually open so handleCloseForm can go back to it.
    const handleEditEvent = (event: CalendarEvent) => {
        if (detailsOpened) setReturnModal("details");
        else if (agendaOpen) setReturnModal("agenda");
        else setReturnModal(null);

        setSlotRange(null);
        setAllDayTargetDate(null);
        setDetailsOpened(false);
        setAgendaOpen(false);
        setEditingEvent(event);
        setFormOpened(true);
        stack.open('event-form');
    };

    // Clicking or dragging an empty Day/Week/Month time slot opens a blank
    // add-event form prefilled with that exact range. Nothing to return to
    // here, so returnModal stays cleared. A plain click is a zero-distance
    // drag as far as the library's concerned, so this same handler covers
    // both click-to-create and drag-to-create consistently across all three
    // views (Month view no longer has a separate onDayClick navigation
    // handler, precisely to avoid the two colliding on the same gesture).
    const handleTimeSlotClick = ({ slotStart, slotEnd }: { slotStart: string; slotEnd: string }) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setAllDayTargetDate(null);
        setSlotRange({ start: slotStart, end: slotEnd });
        setFormOpened(true);
        stack.open('event-form');
    };

    const handleSlotDragEnd = (rangeStart: string, rangeEnd: string) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setAllDayTargetDate(null);
        setSlotRange({ start: rangeStart, end: rangeEnd });
        setFormOpened(true);
        stack.open('event-form');
    };

    // Clicking the all-day row for a given day opens a blank add-event form
    // seeded for that date with "all day" already filled in. We deliberately
    // leave slotRange untouched (null) here - EventForm already defaults to
    // allDay: true whenever no initialStartTime/initialEndTime are passed,
    // so this reuses that existing behavior rather than adding a new flag.
    const handleAllDaySlotClick = (targetDate: string) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setSlotRange(null);
        setAllDayTargetDate(targetDate);
        setFormOpened(true);
        stack.open('event-form');
    };

    const handleCloseForm = () => {
        setFormOpened(false);
        stack.close('event-form');
        setEditingEvent(undefined);
        setSlotRange(null);
        setAllDayTargetDate(null);

        if (returnModal === "details") setDetailsOpened(true);
        else if (returnModal === "agenda") setAgendaOpen(true);
        setReturnModal(null);
    };

    const openAgenda = () => {
        setAgendaAnchorDate(date);
        setAgendaOpen(true);
    };

    const goToToday = () => {
        setAgendaAnchorDate(dayjs().format("YYYY-MM-DD"));
    };

    const stepAgenda = (direction: 1 | -1) => {
        const unit = view === "day" ? "day" : view === "week" ? "week" : "month";
        setAgendaAnchorDate((current) => dayjs(current).add(direction, unit).format("YYYY-MM-DD"));
    };

    const agendaRange = (() => {
        const d = dayjs(agendaAnchorDate);
        if (view === "day") return { start: d.format("YYYY-MM-DD"), end: d.format("YYYY-MM-DD") };
        if (view === "week") return { start: d.startOf("week").format("YYYY-MM-DD"), end: d.endOf("week").format("YYYY-MM-DD") };
        return { start: d.startOf("month").format("YYYY-MM-DD"), end: d.endOf("month").format("YYYY-MM-DD") };
    })();

    // Our own range label: full month name, and genuinely deduped (a single
    // day shows just that one date, not "Sep 17 - Sep 17"). AgendaView's own
    // built-in header is hidden via the agendaViewHeader classNames selector
    // below, since headerFormat itself can't dedupe (see AgendaView usage).
    const agendaHeaderLabel = agendaRange.start === agendaRange.end
        ? formatAgendaHeaderDate(agendaRange.start)
        : `${formatAgendaHeaderDate(agendaRange.start)} \u2013 ${formatAgendaHeaderDate(agendaRange.end)}`;

    // Row content for the agenda modal's event list: title/dots/time on the
    // left, the shared edit/delete/leave menu on the right. The menu sits in
    // its own click-stopping wrapper so tapping it doesn't also trigger the
    // row's onClick (which opens EventDetailsModal via AgendaView's
    // onEventClick, same as Day/Week/Month).
    const renderAgendaEvent: AgendaRenderEvent = (event, props) => {
        const payload = event.payload as EventColorPayload | undefined;
        const colors = payload?.colors ?? [event.color];
        const start = dayjs(event.start);
        const end = dayjs(event.end);
        const isMultiDay = !start.isSame(end, "day");

        const timeLabel = payload?.hasTime === false
            ? (isMultiDay ? `${formatEventDate(start)} \u2013 ${formatEventDate(end)}` : "All day")
            : isMultiDay
                ? `${formatEventDateTime(start)} \u2013 ${formatEventDateTime(end)}`
                : `${start.format("h:mma")} \u2013 ${end.format("h:mma")}`;

        return (
            <UnstyledButton {...props} style={{ width: "100%", padding: "8px 4px" }}>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Text fz={14} fw={500} c="black">
                            {event.title}
                        </Text>
                        <EventMemberDots colors={colors} names={payload?.memberNames} />
                        <Text fz={12} c="dimmed">{timeLabel}</Text>
                    </Stack>
                    <div onClick={(e) => e.stopPropagation()}>
                        <EventActionsMenu occurrence={event} onEdit={handleEditEvent} />
                    </div>
                </Group>
            </UnstyledButton>
        );
    };

    const memberFilterRow = (
        <MemberFilterRow
            members={household?.members ?? []}
            selectedIds={effectiveSelectedIds}
            onToggle={handleToggleMember}
        />
    );

    const detailsModal = (
        <EventDetailsModal
            key={selectedEvent?.id ?? "none"}
            opened={detailsOpened}
            onClose={() => setDetailsOpened(false)}
            occurrence={liveEvent}
            onEdit={handleEditEvent}
        />
    );

    const eventFormModal = household?.id ? (
        <EventForm
            householdId={household.id}
            opened={formOpened}
            initialDate={
                slotRange ? dayjs(slotRange.start).toDate()
                    : allDayTargetDate ? dayjs(allDayTargetDate).toDate()
                        : dayjs(date).toDate()
            }
            initialEndDate={slotRange ? dayjs(slotRange.end).format("YYYY-MM-DD") : undefined}
            initialStartTime={slotRange ? dayjs(slotRange.start).format(TIME_FORMAT) : undefined}
            initialEndTime={slotRange ? dayjs(slotRange.end).format(TIME_FORMAT) : undefined}
            onClose={handleCloseForm}
            edit={Boolean(editingEvent)}
            event={editingEvent}
            stack={stack}
        />
    ) : null;

    const renderWeekEvent: WeekRenderEvent = (event, props) => {
        const isMultiDay = !dayjs(event.start).isSame(dayjs(event.end), "day");

        if (isMultiDay) {
            const isBeingDragged = draggingEventId !== null && String(draggingEventId) === String(event.id);
            const forcePointerEvents = draggingEventId === null || isBeingDragged;

            return (
                <UnstyledButton
                    {...props}
                    style={forcePointerEvents ? { ...props.style, pointerEvents: "auto" } : props.style}
                >
                    {renderEventBody(event)}
                </UnstyledButton>
            );
        }

        return (
            <UnstyledButton {...props}>
                <div style={{ position: "absolute", inset: 0 }}>{props.children}</div>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {renderEventBody(event)}
                </div>
            </UnstyledButton>
        );
    };

    if (isSmallScreen) {
        return (
            <>
                <Group mb="xs">{memberFilterRow}</Group>
                <MobileMonthView
                    date={date}
                    onDateChange={setDate}
                    events={mobileEvents ?? []}
                    renderEvent={renderMobileMonthEvent}
                />
            </>
        );
    }

    const agendaModal = (
        <Modal opened={agendaOpen} onClose={() => setAgendaOpen(false)} title={agendaHeaderLabel} size="lg">
            <Group justify="space-between" mb="sm">
                {memberFilterRow}
                <Group gap={4}>
                    <Button size="xs" variant="subtle" onClick={goToToday}>Today</Button>
                    <ActionIcon variant="light" onClick={() => stepAgenda(-1)} aria-label="Previous">‹</ActionIcon>
                    <ActionIcon variant="light" onClick={() => stepAgenda(1)} aria-label="Next">›</ActionIcon>
                </Group>
            </Group>
            <AgendaView
                rangeStart={agendaRange.start}
                rangeEnd={agendaRange.end}
                events={scheduleEvents ?? []}
                renderEvent={renderAgendaEvent}
                onEventClick={handleEventClick}
                classNames={{ agendaViewHeader: "toby-hidden-agenda-header" }}
            />
        </Modal>
    );

    const toolbar = (
        <Group justify="space-between" mb="xs">
            {memberFilterRow}
            <Button size="xs" variant="light" onClick={openAgenda}>Agenda</Button>
        </Group>
    );

    if (view === "day") {
        return (
            <>
                {agendaModal}
                {detailsModal}
                {eventFormModal}
                {toolbar}
                <DayView
                    date={date}
                    onDateChange={setDate}
                    onViewChange={setView}
                    events={dayViewEvents}
                    withAllDaySlot
                    withEventsDragAndDrop
                    withEventResize
                    withDragSlotSelect
                    canDragEvent={canInteractWithEvent}
                    canResizeEvent={canInteractWithEvent}
                    onEventDrop={handleEventMove}
                    onEventResize={handleEventMove}
                    onEventClick={handleEventClick}
                    onTimeSlotClick={handleTimeSlotClick}
                    onSlotDragEnd={handleSlotDragEnd}
                    onAllDaySlotClick={handleAllDaySlotClick}
                    moreEventsProps={{ classNames: { moreEventsButton: "toby-more-events-button" } }}
                    renderEventBody={renderEventBody}
                />
            </>
        );
    }

    if (view === "week") {
        return (
            <>
                {agendaModal}
                {detailsModal}
                {eventFormModal}
                {toolbar}
                <WeekView
                    date={date}
                    onDateChange={setDate}
                    onViewChange={setView}
                    events={scheduleEvents ?? []}
                    withAllDaySlots
                    withEventsDragAndDrop
                    withEventResize
                    withDragSlotSelect
                    canDragEvent={canInteractWithEvent}
                    canResizeEvent={canInteractWithEvent}
                    onEventDrop={handleEventMove}
                    onEventResize={handleEventMove}
                    onEventDragStart={(event) => setDraggingEventId(event.id)}
                    onEventDragEnd={() => setDraggingEventId(null)}
                    onEventClick={handleEventClick}
                    onTimeSlotClick={handleTimeSlotClick}
                    onSlotDragEnd={handleSlotDragEnd}
                    onAllDaySlotClick={handleAllDaySlotClick}
                    moreEventsProps={{ classNames: { moreEventsButton: "toby-more-events-button" } }}
                    renderEventBody={renderEventBody}
                    renderEvent={renderWeekEvent}
                />
            </>
        );
    }

    if (view === "month") {
        return (
            <>
                {agendaModal}
                {detailsModal}
                {eventFormModal}
                {toolbar}
                <MonthView
                    date={date}
                    onDateChange={setDate}
                    onViewChange={setView}
                    events={scheduleEvents ?? []}
                    maxEventsPerDay={10}
                    withEventsDragAndDrop
                    withEventResize
                    withDragSlotSelect
                    canDragEvent={canInteractWithEvent}
                    canResizeEvent={canInteractWithEvent}
                    onEventDrop={handleEventMove}
                    onEventResize={handleEventMove}
                    onEventClick={handleEventClick}
                    onSlotDragEnd={handleSlotDragEnd}
                    renderEventBody={renderEventBody}
                />
            </>
        );
    }

    return (
        <>
            {agendaModal}
            {detailsModal}
            {eventFormModal}
            {toolbar}
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
                renderEventBody={renderEventBody}
            />
        </>
    );
}