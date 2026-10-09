import { useState } from "react";
import dayjs from "dayjs";
import { getDateRange, toDateString, type RangeScope } from "../utils";
import type { ScheduleViewLevel } from "node_modules/@mantine/schedule/lib/types";

const AGENDA_TITLES = {
    day: "Agenda - Day",
    week: "Agenda - Week",
    month: "Agenda - Month",
} as const;

const LABEL_FORMAT = "dddd, MMMM D";
const LABEL_FORMAT_WITH_YEAR = "dddd, MMMM D, YYYY";

type AgendaScope = Extract<RangeScope, keyof typeof AGENDA_TITLES>;

type UseAgendaModalProps = {
    view: ScheduleViewLevel;
};

/** Year view (and anything not day/week) falls back to a month-long agenda. */
const getAgendaScope = (view: ScheduleViewLevel, isSingleDay: boolean): AgendaScope => {
    if (isSingleDay || view === "day") return "day";
    return view === "week" ? "week" : "month";
};

const getSingleDayLabel = (date: string) => {
    const day = dayjs(date);
    return day.format(day.year() === dayjs().year() ? LABEL_FORMAT : LABEL_FORMAT_WITH_YEAR);
};

export const useAgendaModal = ({ view }: UseAgendaModalProps) => {
    const [isOpened, setIsOpened] = useState(false);
    const [anchorDate, setAnchorDate] = useState(() => toDateString());
    // Year view's day click opens a one-day agenda without leaving Year view, so `view` alone can't express it.
    const [isSingleDay, setIsSingleDay] = useState(false);

    const scope = getAgendaScope(view, isSingleDay);
    const range = getDateRange(anchorDate, scope);

    const open = () => setIsOpened(true);
    const close = () => setIsOpened(false);

    const openForView = (date: string) => {
        setAnchorDate(date);
        setIsSingleDay(false);
        open();
    };

    const openForDay = (date: string) => {
        setAnchorDate(date);
        setIsSingleDay(true);
        open();
    };

    const goToToday = () => setAnchorDate(toDateString());

    const step = (direction: 1 | -1) =>
        setAnchorDate((current) => toDateString(dayjs(current).add(direction, scope)));

    return {
        isOpened,
        open,
        close,
        openForView,
        openForDay,
        goToToday,
        step,
        range,
        title: AGENDA_TITLES[scope],
        isSingleDay: scope === "day",
        singleDayLabel: getSingleDayLabel(range.start),
    };
};