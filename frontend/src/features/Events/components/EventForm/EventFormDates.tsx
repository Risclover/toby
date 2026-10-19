import type { ChangeEvent } from "react";
import dayjs from "dayjs";
import { Checkbox, getDefaultZIndex, Group } from "@mantine/core";
import { DatePickerInput, type DateFormatter } from "@mantine/dates";
import type { EventFormInstance } from "../../types";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

type DateRange = [string | null, string | null];

type Props = {
    form: EventFormInstance;
    isSmallScreen: boolean;
};

const DATE_PICKER_STYLES = {
    section: { color: "var(--primary)" },
    day: {
        "&[data-weekend]": { color: "#4e0202" },
        "&[data-selected], &[data-selected]:hover": {
            backgroundColor: "#2563eb",
            color: "white",
        },
    },
};

/** "Oct 19" for a single day, "Oct 19 – Oct 21" for a range. */
const formatDateRangeValue: DateFormatter = ({ type, date, locale, format }) => {
    if (type !== "range" || !Array.isArray(date)) return "";

    const [start, end] = date;
    if (!start) return "";

    const startLabel = dayjs(start).locale(locale).format(format);
    if (!end || dayjs(end).isSame(start, "day")) return startLabel;

    return `${startLabel} \u2013 ${dayjs(end).locale(locale).format(format)}`;
};

export const EventFormDates = ({ form, isSmallScreen }: Props) => {
    const { startDate, endDate } = form.getValues();
    const dateRangeValue: DateRange = [startDate || null, endDate || null];

    // A single day is stored as startDate with an empty endDate.
    const setDates = (start: string, end: string) => {
        form.setFieldValue("startDate", start);
        form.setFieldValue("endDate", end);
        form.validate();
    };

    const handleDateRangeChange = ([first, second]: DateRange) => {
        if (!first) return setDates("", "");
        if (!second) return setDates(first, "");

        const [earlier, later] = first <= second ? [first, second] : [second, first];
        setDates(earlier, earlier === later ? "" : later);
    };

    const handleAllDayChange = (event: ChangeEvent<HTMLInputElement>) => {
        form.setFieldValue("allDay", event.currentTarget.checked);
        form.validate();
    };

    return (
        <>
            <Group grow align="flex-start">
                <DatePickerInput
                    type="range"
                    allowSingleDateInRange
                    value={dateRangeValue}
                    onChange={handleDateRangeChange}
                    dropdownType={isSmallScreen ? "modal" : "popover"}
                    modalProps={{ zIndex: getDefaultZIndex("popover") }}
                    placeholder="Select event date(s)"
                    label="Date"
                    description="Select a single date, or create a range (start and end dates)."
                    required
                    leftSection={<CalendarMonthRoundedIcon />}
                    leftSectionWidth="40px"
                    color="navy"
                    styles={DATE_PICKER_STYLES}
                    firstDayOfWeek={0}
                    clearable={!!endDate}
                    valueFormatter={formatDateRangeValue}
                />
            </Group>
            <Checkbox
                {...form.getInputProps("allDay", { type: "checkbox" })}
                key={form.key("allDay")}
                label="All Day"
                onChange={handleAllDayChange}
                color="navy"
            />
        </>
    );
};