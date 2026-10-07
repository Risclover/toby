import type { ComponentProps } from "react";
import { Schedule, DayView, WeekView, MonthView, YearView, MobileMonthView, AgendaView } from "@mantine/schedule";
import { Modal, Button, ActionIcon, Group, Stack, Text, UnstyledButton, useModalsStack } from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { ButtonStandard } from "@/components/ButtonStandard";
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
    toMobileMonthDayDots,
    toDayViewEvents,
    toRangeEvents,
    toMemberColorStripe,
    type EventColorPayload,
} from "../../utils/getEventColors";
import { formatEventDate, formatEventDateTime } from "../../utils/formatEventDate";
import { EventMemberDots } from "../../components/CalendarPage/EventColorDots";
import { MemberFilterRow } from "../../components/CalendarPage/MemberFilterRow";
import { persistEventMove } from "../../utils/persistEventMove";
import { EventDetailsModal } from "./EventDetailsModal";
import { EventActionsMenu } from "./EventActionsMenu";
import { EventForm, TIME_FORMAT } from "../../components/EventForm/EventForm";
import type { ModalId } from "../../types";


type ScheduleViewLevel = NonNullable<ComponentProps<typeof Schedule>["view"]>;
type ScheduleEventData = NonNullable<ComponentProps<typeof Schedule>["events"]>[number];
type AgendaRenderEvent = NonNullable<ComponentProps<typeof AgendaView>["renderEvent"]>;
type WeekRenderEvent = NonNullable<ComponentProps<typeof WeekView>["renderEvent"]>;

type SlotRange = { start: string; end: string };

const canInteractWithEvent = (event: { payload?: unknown }) =>
    !(event.payload as EventColorPayload | undefined)?.isDayViewContinuation;

export const FullPageCalendar = () => {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    // MobileMonthView's selected-day (what the events list below the grid
    // actually shows) - previously left entirely to Mantine's own internal,
    // uncontrolled state, which only ever changed on a day-cell tap. That
    // meant navigating to a different month via stepMobileMonth/the month
    // picker/goToCurrentMonth changed `date` (the displayed grid) but left
    // the component's own selected day frozen on whatever was last tapped,
    // producing a header that still read e.g. "October 31" while the list
    // under it went empty, since the new month's events have no entry for a
    // day that isn't even in it. Now controlled from here (passed as
    // selectedDate/onSelectedDateChange below) so every place that changes
    // `date` can also resync this to something that actually exists in the
    // newly-shown month - see resolveMobileSelectedDate.
    const [mobileSelectedDate, setMobileSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
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
    // Month view's drag-select reports a plain [rangeStart, rangeEnd] date
    // pair the exact same shape slotRange has -- but Month view has no time
    // granularity at all, only whole days, while slotRange is also used for
    // Day/Week's genuine time-slot drags (which DO carry real start/end
    // times). Reusing slotRange for both meant EventForm always got fed
    // initialStartTime/initialEndTime derived from it, which seeded a
    // month-view multi-day drag as a TIMED event (12:00am - 11:59pm) instead
    // of an all-day event spanning that date range. Kept as its own state
    // so the two flows can never bleed into each other.
    const [monthDragRange, setMonthDragRange] = useState<SlotRange | null>(null);
    // Year view's day-cell click opens the Agenda modal scoped to just that
    // one day, without touching the main `view`/`date` (you stay on Year
    // view underneath). agendaRange normally derives its span from `view`,
    // which doesn't work here since `view` is still "year" - this flag lets
    // agendaRange (and stepAgenda's step unit) force single-day mode instead.
    // The toolbar's own "Agenda" button always clears it back to false.
    const [agendaSingleDay, setAgendaSingleDay] = useState(false);
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

    // Backs MemberFilterRow's "All" chip. Toggles the whole row at once:
    // select everyone if anyone's currently missing, or clear the
    // selection entirely (hiding every member's events) if everyone's
    // already selected. selectedMemberIds === null already means "all"
    // via effectiveSelectedIds, but isAllMembersSelected is checked
    // against effectiveSelectedIds rather than the raw state so this
    // reads correctly whether selection got to "everyone" via that null
    // default or by individually re-selecting every member by hand.
    const isAllMembersSelected = allMemberIds.length > 0 && allMemberIds.every((id) => effectiveSelectedIds.includes(id));

    const handleToggleAllMembers = () => {
        setSelectedMemberIds(isAllMembersSelected ? [] : allMemberIds);
    };

    const visibleEvents = useMemo(() => {
        if (!events) return events;
        return events.filter((event) => {
            const attendeeIds = event.allMembers ? allMemberIds : event.attendeeIds ?? [];
            return attendeeIds.some((id) => effectiveSelectedIds.includes(id));
        });
    }, [events, allMemberIds, effectiveSelectedIds]);

    const scheduleEvents = visibleEvents?.map((event) => toScheduleEvent(event, household?.members ?? []));
    const dayViewEvents = scheduleEvents ? toDayViewEvents(scheduleEvents, date) : [];

    // Week/Month/Agenda used to hand Mantine the raw recurring event with
    // its `recurrence` field intact and let the library expand occurrences
    // internally -- but Mantine's own expansion has the same DST bug
    // toDayViewEvents/toRangeEvents work around (see getEventColors.ts):
    // an occurrence computed on the other side of a DST transition from
    // the event's dtstart lands on the wrong calendar day. toRangeEvents
    // pre-expands every recurring event into concrete, correctly-dated
    // occurrences for whatever range is actually visible, so Mantine never
    // computes an occurrence date itself in any view now, not just Day.
    //
    // Month view's grid shows some leading/trailing days from the
    // adjacent months to fill out the weeks it displays, so the range is
    // padded out to full calendar weeks on both ends rather than just
    // startOf("month")/endOf("month"), or an occurrence landing in one of
    // those padding days would silently go missing.
    const weekViewEvents = scheduleEvents
        ? toRangeEvents(
            scheduleEvents,
            dayjs(date).startOf("week").format("YYYY-MM-DD"),
            dayjs(date).endOf("week").format("YYYY-MM-DD")
        )
        : [];
    const monthViewEvents = scheduleEvents
        ? toRangeEvents(
            scheduleEvents,
            dayjs(date).startOf("month").startOf("week").format("YYYY-MM-DD"),
            dayjs(date).endOf("month").endOf("week").format("YYYY-MM-DD")
        )
        : [];
    // Same padded-to-full-weeks range as monthViewEvents (MobileMonthView's
    // grid shows the same leading/trailing days from adjacent months), and
    // now routes through toMobileMonthEvents' own toRangeEvents-based
    // pre-expansion internally rather than letting Mantine expand recurring
    // events itself - see getEventColors.ts for why (this was the source of
    // the duplicate-per-person-dot bug: MobileMonthView was still doing its
    // own internal rrule expansion off the raw `recurrence` field).
    const mobileEvents = scheduleEvents
        ? toMobileMonthEvents(
            scheduleEvents,
            dayjs(date).startOf("month").startOf("week").format("YYYY-MM-DD"),
            dayjs(date).endOf("month").endOf("week").format("YYYY-MM-DD")
        )
        : [];
    // Powers the mobile grid's own day-cell dots via getMobileDayProps below
    // - kept separate from mobileEvents (which still feeds the below-grid
    // list) because the grid and the list now intentionally show different
    // things: one dot per DISTINCT PERSON per day here, vs. one row per
    // real event there. See toMobileMonthDayDots' comment in
    // getEventColors.ts for why this had to be a second computation rather
    // than reusing mobileEvents.
    const mobileDayDots = scheduleEvents
        ? toMobileMonthDayDots(
            scheduleEvents,
            dayjs(date).startOf("month").startOf("week").format("YYYY-MM-DD"),
            dayjs(date).endOf("month").endOf("week").format("YYYY-MM-DD")
        )
        : {};

    const liveEvent = useMemo(() => {
        if (!selectedEvent) return null;
        const recurringInstance = (selectedEvent as any).recurringInstance as { recurringEventId?: string | number } | undefined;
        // Continuation/dot segments carry a synthetic id like "<realId>::continuation2"
        // or "<realId>::dot1" - strip that suffix to recover the real event id.
        // Genuine recurring occurrences use Mantine's own recurringInstance.recurringEventId instead.
        const masterId = recurringInstance?.recurringEventId ?? String(selectedEvent.id).split("::")[0];
        const freshSource = visibleEvents?.find((e) => String(e.id) === String(masterId));
        if (!freshSource) return null;

        const fresh = toScheduleEvent(freshSource, household?.members ?? []);
        // fresh.payload comes straight from toScheduleEvent, which never runs
        // through toDayViewEvents - so it never carries originalStart/originalEnd,
        // even though the ACTUAL clicked segment's own payload does (when it's a
        // Day view continuation of a multi-day event). Carry those two fields
        // forward from the segment that was really clicked, or EventDetailsModal
        // falls back to that segment's day-clipped start/end instead of the
        // event's true full span.
        const selectedPayload = selectedEvent.payload as EventColorPayload | undefined;

        // selectedEvent is a snapshot captured at click time, so title/start/end
        // go stale the moment an edit saves -- but only title/start/end never
        // refreshed here before; color/payload always did. For a NON-recurring
        // event there's no ambiguity about what "the" occurrence is, so it's
        // safe to fully adopt fresh's title/start/end too. A recurring event
        // can't do the same: selectedEvent.start/end identify the SPECIFIC
        // occurrence that was clicked (DeleteRecurringEventConfirmation's
        // occurrenceStart depends on that), while freshSource is the series'
        // own master record -- overwriting with fresh.start/end here would
        // silently swap "the Nov 9th occurrence" for "the series' dtstart",
        // which is wrong even when nothing was just edited.
        const isRecurring = Boolean(freshSource.rrule);
        return {
            ...selectedEvent,
            ...(isRecurring ? {} : { title: fresh.title, start: fresh.start, end: fresh.end }),
            color: fresh.color,
            payload: {
                ...fresh.payload,
                ...(selectedPayload?.originalStart
                    ? { originalStart: selectedPayload.originalStart, originalEnd: selectedPayload.originalEnd }
                    : {}),
            },
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

    // Year view has no per-event interaction of its own (no onEventClick),
    // only a day-cell click. Rather than navigating away to Day view, this
    // opens the existing Agenda modal scoped to just that one date - the
    // same "day popover" pattern Google Calendar's year view uses, reusing
    // a component that already exists instead of adding a new one.
    const handleDayClick = (clickedDate: string) => {
        setAgendaAnchorDate(clickedDate);
        setAgendaSingleDay(true);
        setAgendaOpen(true);
    };

    // Replaces YearView's own default day-cell content (a day number plus
    // up to 3 small colored indicator divs, one per entry in the events
    // array we hand it - confirmed by reading YearViewMonth.mjs directly)
    // with just the plain date number. See the comment on the <YearView>
    // block below for why the per-member indicator was dropped here
    // rather than shrunk to fit - renderDay is what makes that possible:
    // unlike MobileMonthView's getDayProps (style/className/onClick only),
    // YearView's renderDay replaces the day cell's ENTIRE content, no CSS
    // trickery required.
    const renderYearDay = (dateStr: string) => dayjs(dateStr).format("D");

    // Shared by EventDetailsModal's menu and the agenda row's menu. Remembers
    // which of the two was actually open so handleCloseForm can go back to it.
    const handleEditEvent = (event: CalendarEvent) => {
        if (detailsOpened) setReturnModal("details");
        else if (agendaOpen) setReturnModal("agenda");
        else setReturnModal(null);

        setSlotRange(null);
        setAllDayTargetDate(null);
        setMonthDragRange(null);
        setDetailsOpened(false);
        setAgendaOpen(false);
        setEditingEvent(event);
        setFormOpened(true);
        stack.open('event-form');
    };

    // Clicking or dragging an empty Day/Week time slot opens a blank
    // add-event form prefilled with that exact range. Nothing to return to
    // here, so returnModal stays cleared. A plain click is a zero-distance
    // drag as far as the library's concerned, so this same handler covers
    // both click-to-create and drag-to-create consistently across Day/Week.
    // NOT used by Month view anymore -- see handleMonthSlotDragEnd below.
    const handleTimeSlotClick = ({ slotStart, slotEnd }: { slotStart: string; slotEnd: string }) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setAllDayTargetDate(null);
        setMonthDragRange(null);
        setSlotRange({ start: slotStart, end: slotEnd });
        setFormOpened(true);
        stack.open('event-form');
    };

    const handleSlotDragEnd = (rangeStart: string, rangeEnd: string) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setAllDayTargetDate(null);
        setMonthDragRange(null);
        setSlotRange({ start: rangeStart, end: rangeEnd });
        setFormOpened(true);
        stack.open('event-form');
    };

    // Month view's drag-select reports a [rangeStart, rangeEnd] pair too,
    // but at day granularity only -- there's no time-of-day involved, so
    // unlike handleSlotDragEnd (Day/Week) this must NOT populate
    // initialStartTime/initialEndTime, or EventForm seeds a timed event
    // (12:00am - 11:59pm) instead of an all-day event spanning the range.
    const handleMonthSlotDragEnd = (rangeStart: string, rangeEnd: string) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setSlotRange(null);
        setAllDayTargetDate(null);
        setMonthDragRange({ start: rangeStart, end: rangeEnd });
        setFormOpened(true);
        stack.open('event-form');
    };

    // Clicking the all-day row for a given day opens a blank add-event form
    // seeded for that date with "all day" already filled in. We deliberately
    // leave slotRange untouched (null) here - EventForm already defaults to
    // allDay: true whenever no initialStartTime/initialEndTime are passed,
    // so this reuses that existing behavior rather than adding a new flag.
    // Also reused directly as MonthView's onDayClick (a single-cell click,
    // not a drag) -- same "blank all-day form for this one date" behavior,
    // just a different trigger.
    const handleAllDaySlotClick = (targetDate: string) => {
        setReturnModal(null);
        setEditingEvent(undefined);
        setSlotRange(null);
        setMonthDragRange(null);
        setAllDayTargetDate(targetDate);
        setFormOpened(true);
        stack.open('event-form');
    };

    const handleCloseForm = (options?: { saved?: boolean }) => {
        // Captured before setEditingEvent(undefined) below clears it.
        const wasEditingRecurring = Boolean(editingEvent?.rrule);

        setFormOpened(false);
        stack.close('event-form');
        setEditingEvent(undefined);
        setSlotRange(null);
        setAllDayTargetDate(null);
        setMonthDragRange(null);

        // Reopening Details after a save is only safe when liveEvent can
        // actually represent what's now true. For a non-recurring event
        // liveEvent already fully refreshes title/start/end (see its
        // useMemo above), so it's fine to reopen. For a recurring event
        // it deliberately does NOT overwrite start/end (there's no single
        // fresh occurrence to fall back to), so reopening Details right
        // after a recurring save would show either stale data or -- if
        // the previously-viewed occurrence no longer exists (edited/
        // detached/excluded) -- a broken modal. Skip it in that case only;
        // Agenda has no such problem since it re-renders reactively from
        // fresh data regardless.
        const skipDetails = options?.saved && wasEditingRecurring;
        if (returnModal === "details" && !skipDetails) setDetailsOpened(true);
        else if (returnModal === "agenda") setAgendaOpen(true);
        setReturnModal(null);
    };

    const openAgenda = () => {
        setAgendaAnchorDate(date);
        setAgendaSingleDay(false);
        setAgendaOpen(true);
    };

    const goToToday = () => {
        setAgendaAnchorDate(dayjs().format("YYYY-MM-DD"));
    };

    const stepAgenda = (direction: 1 | -1) => {
        const unit = (view === "day" || agendaSingleDay) ? "day" : view === "week" ? "week" : "month";
        setAgendaAnchorDate((current) => dayjs(current).add(direction, unit).format("YYYY-MM-DD"));
    };

    const agendaRange = (() => {
        const d = dayjs(agendaAnchorDate);
        if (view === "day" || agendaSingleDay) return { start: d.format("YYYY-MM-DD"), end: d.format("YYYY-MM-DD") };
        if (view === "week") return { start: d.startOf("week").format("YYYY-MM-DD"), end: d.endOf("week").format("YYYY-MM-DD") };
        return { start: d.startOf("month").format("YYYY-MM-DD"), end: d.endOf("month").format("YYYY-MM-DD") };
    })();

    const agendaViewEvents = scheduleEvents
        ? toRangeEvents(scheduleEvents, agendaRange.start, agendaRange.end)
        : [];

    // The Modal's own title bar - static per scope rather than repeating
    // the date, which AgendaView's own per-day group headers (below each
    // day's events, e.g. "Thursday, October 1") already show once, correctly.
    const agendaModalTitle = (view === "day" || agendaSingleDay)
        ? "Agenda - Day"
        : view === "week"
            ? "Agenda - Week"
            : "Agenda - Month";

    // In single-day mode, both of AgendaView's own built-in date displays
    // are hidden - its range header (agendaViewHeader, e.g. "Oct 1, 2026 -
    // Oct 1, 2026") AND its per-day group header (agendaViewDateHeader, e.g.
    // "Thursday, October 1"). Originally tried keeping the per-day group
    // header and only hiding the range header, conditioned on whether
    // agendaViewEvents was non-empty - but agendaViewEvents turned out to
    // NOT be reliably filtered down to just this one day (confirmed by
    // testing: it had 16 entries on a day AgendaView itself displayed as
    // "No events"), so there was no trustworthy signal for "will the group
    // header render." Hiding both and always showing our own single fallback
    // label instead removes that guesswork entirely - exactly one date
    // display, always correct, regardless of what AgendaView decides to
    // render internally. Week/month keep both of AgendaView's defaults,
    // since the per-day group headers there don't convey the overall span
    // on their own.
    const isSingleDayAgenda = view === "day" || agendaSingleDay;

    // Weekday + month + day, matching the format Mantine's own (now hidden)
    // agendaViewDateHeader used - e.g. "Wednesday, October 5". Year is only
    // appended when it differs from the current year, same convention as
    // formatEventDate/formatEventDateTime/formatAgendaHeaderDate in
    // formatEventDate.ts (kept inline here rather than adding a fourth
    // near-duplicate export to that file for one call site).
    const singleDayAgendaLabel = (() => {
        const d = dayjs(agendaRange.start);
        const withYear = d.year() !== dayjs().year();
        return d.format(withYear ? "dddd, MMMM D, YYYY" : "dddd, MMMM D");
    })();

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
            ? (isMultiDay ? `${formatEventDate(start)} – ${formatEventDate(end)}` : "All day")
            : isMultiDay
                ? `${formatEventDateTime(start)} – ${formatEventDateTime(end)}`
                : `${start.format("h:mma")} – ${end.format("h:mma")}`;

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
            onToggleAll={handleToggleAllMembers}
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
                    : monthDragRange ? dayjs(monthDragRange.start).toDate()
                        : allDayTargetDate ? dayjs(allDayTargetDate).toDate()
                            : dayjs(date).toDate()
            }
            initialEndDate={
                slotRange ? dayjs(slotRange.end).format("YYYY-MM-DD")
                    : monthDragRange ? dayjs(monthDragRange.end).format("YYYY-MM-DD")
                        : undefined
            }
            // Deliberately NEVER derived from monthDragRange -- see its
            // definition above. Only slotRange (Day/Week's genuine
            // time-slot drag) should ever seed a timed event.
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

    // Same row content as renderAgendaEvent (title/dots/time on the left,
    // the edit/delete menu on the right) - previously this just passed
    // Mantine's own default row content through untouched (see mobile
    // agenda work), which is why the two looked different despite both
    // being "an agenda." Defined inline rather than staying in
    // mobileMonthEventRender.ts because it needs handleEditEvent in scope
    // for the menu, same reason renderAgendaEvent/renderWeekEvent are
    // inline instead of standalone utils.
    //
    // isDotSibling still has to be checked first and return a real
    // (hidden) element rather than null - toMobileMonthEvents fans a
    // multi-attendee event out into one marker per member per day, and
    // the selected-day list below the grid should show exactly one row
    // per real event, not one per attendee.
    const renderMobileMonthEvent: NonNullable<ComponentProps<typeof MobileMonthView>["renderEvent"]> = (event, props) => {
        const payload = event.payload as (EventColorPayload & { isDotSibling?: boolean }) | undefined;

        if (payload?.isDotSibling) {
            return <UnstyledButton {...props} style={{ ...props.style, display: "none" }} />;
        }

        const colors = payload?.colors ?? [event.color];
        const start = dayjs(event.start);
        const end = dayjs(event.end);
        const isMultiDay = !start.isSame(end, "day");

        const timeLabel = payload?.hasTime === false
            ? (isMultiDay ? `${formatEventDate(start)} – ${formatEventDate(end)}` : "All day")
            : isMultiDay
                ? `${formatEventDateTime(start)} – ${formatEventDateTime(end)}`
                : `${start.format("h:mma")} – ${end.format("h:mma")}`;

        return (
            <UnstyledButton {...props} style={{ ...props.style, width: "100%", padding: "8px 4px" }}>
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

    // MobileMonthView has no working header of its own - unlike Day/Week/
    // Month's shared `toolbar` below, mobile gets its own prev/next-month
    // arrows plus a tappable "Month YYYY" control. MonthPickerInput (not
    // DatePickerInput, which the homepage widget uses) because this view
    // only ever shows a month grid - a day-level picker would prompt for
    // more precision than the view can actually use. Borderless, like the
    // homepage widget's picker, but with no rightSection icon - the input
    // itself is the only affordance now (see the comment on mobileMonthHeader
    // below).
    // What mobileSelectedDate should become whenever the displayed month
    // changes out from under it (see that state's own comment above).
    // Mirrors Google Calendar's own month-navigation behavior: snap to
    // today when today actually falls within the newly-shown month,
    // otherwise fall back to the 1st of that month. Either way there's
    // always a concrete day selected and in range - never a stale day left
    // over from whatever month you were on before, and never nothing
    // selected at all.
    const resolveMobileSelectedDate = (monthDate: string) => {
        const today = dayjs();
        return today.isSame(dayjs(monthDate), "month")
            ? today.format("YYYY-MM-DD")
            : dayjs(monthDate).startOf("month").format("YYYY-MM-DD");
    };

    const stepMobileMonth = (direction: 1 | -1) => {
        const nextMonth = dayjs(date).add(direction, "month").format("YYYY-MM-DD");
        setDate(nextMonth);
        setMobileSelectedDate(resolveMobileSelectedDate(nextMonth));
    };

    // Previously only moved the displayed grid (`date`) to the current
    // month - it never touched the selected-day state at all, so tapping
    // "Today" while October 31 was selected left the agenda still reading
    // "October 31" even though the grid had jumped to today's month. Today
    // is unambiguously the right selected day here, so this sets it
    // directly rather than going through resolveMobileSelectedDate (which
    // would land on the same value anyway, just less directly).
    const goToCurrentMonth = () => {
        const today = dayjs().format("YYYY-MM-DD");
        setDate(today);
        setMobileSelectedDate(today);
    };

    // Mantine's own day-cell indicators are hidden entirely (see the
    // mobileMonthViewDayIndicators style below) because reading
    // MobileMonthView.mjs directly showed they're hardcoded - one dot per
    // EVENT in the events array, capped at 3, with zero support for custom
    // content via any prop. getDayProps is the only hook Mantine exposes
    // for a day cell, and it only ever contributes className/style/onClick
    // onto the day button itself, never children.
    //
    // This used to write one small dot per member (up to 8, TOBY's max
    // household size) - see toMemberColorStripe's comment in
    // getEventColors.ts for the two different ways that broke (a
    // pseudo-element collision with Mantine's own today/selected circle,
    // then dots too small to actually see on a phone once that was fixed)
    // - and then a single-gradient stripe, which read as one smeared bar
    // rather than distinct people. toMemberColorStripe now returns a
    // small set of rounded "chip" background layers, one per distinct
    // attendee color that day, as a ready-to-spread style object - no CSS
    // file involved anymore, every background-* property it needs comes
    // back from that one call.
    const getMobileDayProps = (dateStr: string) => {
        const stripeStyle = toMemberColorStripe(mobileDayDots[dateStr] ?? []);
        return stripeStyle ? { style: stripeStyle } : {};
    };

    // No rightSection chevron - with the chevron gone, the input itself is
    // the only affordance, which is the point: tap the date, it opens the
    // picker, no separate icon needed to hint that. Prev/next arrows and the
    // picker are grouped together as one flex unit - otherwise space-between
    // spreads all three items evenly, which pries the arrows away from the
    // picker they're supposed to flank.
    // Today is pinned to the far right and the arrows+picker cluster is
    // genuinely centered - not just left-aligned within leftover space,
    // which is what happened when the arrows+picker Group itself carried
    // flex: 1 (it grew to fill the row, but everything inside it still
    // stacked from the left edge of that growed box). Giving the empty
    // left spacer and the Today slot equal flex weight is what actually
    // centers the middle cluster: both sides claim the same amount of
    // leftover space, so the untouched-width middle sits exactly between
    // them, with Today pushed to the end of its own slot via justifyContent.
    const mobileMonthHeader = (
        <Group justify="space-between" mb="xs" wrap="nowrap" gap={4}>
            <div style={{ flex: 1 }} />
            <Group gap={12} wrap="nowrap">
                <ActionIcon radius="sm" variant="transparent" onClick={() => stepMobileMonth(-1)} aria-label="Previous month">‹</ActionIcon>
                <MonthPickerInput
                    placeholder="Pick month"
                    value={date}
                    onChange={(value) => {
                        if (!value) return;
                        setDate(value);
                        setMobileSelectedDate(resolveMobileSelectedDate(value));
                    }}
                    clearable={false}
                    dropdownType="modal"
                    styles={{ input: { border: 0, textAlign: "center", fontSize: 16, fontWeight: 500 } }}
                />
                <ActionIcon radius="sm" variant="transparent" onClick={() => stepMobileMonth(1)} aria-label="Next month">›</ActionIcon>
            </Group>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                <ButtonStandard variant="subtle" onClick={goToCurrentMonth} label="Today" />
            </div>
        </Group>
    );

    if (isSmallScreen) {
        return (
            <>
                {eventFormModal}
                {detailsModal}
                <Group justify="space-between" mb="xs" wrap="nowrap">
                    {memberFilterRow}
                    {/* Reuses handleAllDaySlotClick (same handler MonthView's
                    onDayClick and the all-day-row click use), targeting
                    today's actual date rather than `date` (the month
                    currently in view) - EventForm requires a real Date to
                    seed itself with (see its initialDate prop/effect), so
                    there's no such thing as a genuinely blank date field;
                    today is the least surprising default when no specific
                    day was clicked. Passing no initialStartTime/
                    initialEndTime is what makes seedBlank default allDay to
                    true - same mechanism the all-day row already relies on,
                    not a special case added for this button. */}
                    <ButtonStandard label="Add event" variant="light" onClick={() => handleAllDaySlotClick(dayjs().format("YYYY-MM-DD"))} />
                </Group>
                {mobileMonthHeader}
                <MobileMonthView
                    date={date}
                    onDateChange={setDate}
                    // Taking control of the selected-day state that was the
                    // root cause of the stale-agenda bug - see
                    // mobileSelectedDate's own comment above. A day-cell tap
                    // still works exactly as before: MobileMonthView calls
                    // onSelectedDateChange with the tapped date, which lands
                    // right back in mobileSelectedDate and re-renders the
                    // component with that as its (now controlled)
                    // selectedDate.
                    selectedDate={mobileSelectedDate}
                    onSelectedDateChange={setMobileSelectedDate}
                    events={mobileEvents ?? []}
                    renderEvent={renderMobileMonthEvent}
                    onEventClick={handleEventClick}
                    getDayProps={getMobileDayProps}
                    // MobileMonthView ships its own header (a "‹ <year>" back
                    // button plus a plain, non-interactive "<Month> <Year>"
                    // Text label - confirmed by inspecting the rendered DOM:
                    // the label is genuinely just mantine-Text-root, never a
                    // button, which is why tapping it never did anything).
                    // mobileMonthViewHeader is the shared parent class for
                    // both pieces (mobileMonthViewHeaderBackButton and
                    // mobileMonthViewHeaderLabel), so hiding that one key
                    // removes both at once rather than needing two. Our own
                    // mobileMonthHeader (rendered where Mantine's own header
                    // used to sit) replaces it with a working prev/next month
                    // pair and an actual tappable picker.
                    //
                    // mobileMonthViewDayIndicators hides Mantine's own
                    // per-event day-cell dots entirely - see getMobileDayProps
                    // above for why (one dot per event, capped at 3, no way
                    // to override via props) and toMemberColorStripe in
                    // getEventColors.ts for the replacement: one rounded
                    // chip per day per distinct attendee, built and
                    // positioned entirely in JS and written onto each
                    // button's own inline style, no external CSS involved.
                    styles={{
                        mobileMonthViewHeader: { display: "none" },
                        mobileMonthViewDayIndicators: { display: "none" },
                    }}
                />
            </>
        );
    }

    const agendaModal = (
        <Modal opened={agendaOpen} onClose={() => setAgendaOpen(false)} title={agendaModalTitle} size="lg">
            <Group justify="space-between" mb="sm">
                {memberFilterRow}
                <Group gap={4}>
                    <Button size="xs" variant="subtle" onClick={goToToday}>Today</Button>
                    <ActionIcon variant="light" onClick={() => stepAgenda(-1)} aria-label="Previous">‹</ActionIcon>
                    <ActionIcon variant="light" onClick={() => stepAgenda(1)} aria-label="Next">›</ActionIcon>
                </Group>
            </Group>
            {isSingleDayAgenda && (
                <Text
                    c="black"
                    mb="xs"
                    style={{ backgroundColor: "var(--mantine-color-gray-1)", padding: "8px 12px" }}
                >
                    {singleDayAgendaLabel}
                </Text>
            )}
            <AgendaView
                rangeStart={agendaRange.start}
                rangeEnd={agendaRange.end}
                events={agendaViewEvents}
                renderEvent={renderAgendaEvent}
                onEventClick={handleEventClick}
                // Both of AgendaView's own date displays are hidden in
                // single-day mode - see the isSingleDayAgenda comment above
                // for why (agendaViewEvents isn't a reliable signal for
                // whether the per-day group header will render, so we always
                // show our own fallback label above instead of trying to
                // predict which of Mantine's headers would show). Both class
                // names were confirmed by inspecting the rendered DOM
                // (mantine-AgendaView-agendaViewHeader and
                // mantine-AgendaView-agendaViewDateHeader), so these are the
                // real Styles API keys, not guesses. `styles` (rather than
                // `classNames`) applies the hide inline with no dependency
                // on an external stylesheet.
                styles={isSingleDayAgenda ? {
                    agendaViewHeader: { display: "none" },
                    agendaViewDateHeader: { display: "none" },
                } : undefined}
            />
        </Modal>
    );

    const toolbar = (
        <Group justify="space-between" mb="xs">
            {memberFilterRow}
            <Group gap={4}>
                <Button size="xs" variant="light" onClick={openAgenda}>Agenda</Button>
                {/* Same handler/target-date convention as the mobile "+"
                button - today's date, no initialStartTime/initialEndTime so
                it opens all-day-checked. Desktop already has plenty of
                other ways to add an event (slot click/drag, day click), so
                this is just a toolbar-level shortcut for "add something,
                unspecified when." */}
                <ButtonStandard label="Add event" variant="light" onClick={() => handleAllDaySlotClick(dayjs().format("YYYY-MM-DD"))} />
            </Group>
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
                    moreEventsProps={{ classNames: { moreEventsButton: "toby-more-events-button", moreEventsDropdown: "toby-more-events-dropdown" } }}
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
                    events={weekViewEvents}
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
                    moreEventsProps={{ classNames: { moreEventsButton: "toby-more-events-button", moreEventsDropdown: "toby-more-events-dropdown" } }}
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
                    events={monthViewEvents}
                    maxEventsPerDay={10}
                    withEventsDragAndDrop
                    withEventResize
                    withDragSlotSelect
                    canDragEvent={canInteractWithEvent}
                    canResizeEvent={canInteractWithEvent}
                    onEventDrop={handleEventMove}
                    onEventResize={handleEventMove}
                    onEventClick={handleEventClick}
                    onDayClick={handleAllDaySlotClick}
                    onSlotDragEnd={handleMonthSlotDragEnd}
                    renderEventBody={renderEventBody}
                />
            </>
        );
    }

    // Year view has no drag/resize, no renderEvent hook, and no onEventClick
    // - only a day-cell click (handleDayClick, which opens the Agenda modal
    // scoped to that one day - full color-coded, named event detail is one
    // tap away). It used to also draw per-member color dots on each day
    // cell (fed from toYearViewEvents' one-marker-per-member-per-day list),
    // but a Year view cell is one of ~420 on screen at once (12 months x
    // ~35 days) vs. Month view's ~35 - nowhere near enough room to make
    // per-member color coding legible, and there's no CSS trick that fixes
    // a cell that's fundamentally too small; it was the same legibility
    // problem Month view's dots/chips/pill iterations already fought
    // through, just with a much worse ceiling. Dropped entirely via
    // renderYearDay (above) rather than shrunk to fit - events is now []
    // since nothing here reads it anymore.
    return (
        <>
            {agendaModal}
            {detailsModal}
            {eventFormModal}
            {toolbar}
            <YearView
                date={date}
                onDateChange={setDate}
                onViewChange={setView}
                events={[]}
                onDayClick={handleDayClick}
                renderDay={renderYearDay}
            />
        </>
    );
}