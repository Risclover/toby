import { Checkbox, getDefaultZIndex, Group } from "@mantine/core"
import { DatePickerInput, type DateFormatter } from "@mantine/dates"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import dayjs from "dayjs";
import type { EventFormValues } from "../../hooks/useEventForm";

type Props = {
    form: any;
    isSmallScreen: boolean;
}

const DATE_PICKER_STYLES = {
    section: { color: "rgb(5, 5, 73)" },
    day: {
        "&[data-weekend]": { color: "#4e0202" },
        "&[data-selected], &[data-selected]:hover": {
            backgroundColor: "#2563eb",
            color: "white",
        },
    },
};

export const EventFormDates = ({ form, isSmallScreen }: Props) => {

    const dateRangeValue: [string | null, string | null] = [
        form.getValues().startDate || null,
        form.getValues().endDate || null,
    ];

    const handleDateRangeChange = ([a, b]: [string | null, string | null]) => {
        if (!a) {
            form.setFieldValue('startDate', '');
            form.setFieldValue('endDate', '');
        } else if (!b) {
            form.setFieldValue('startDate', a);
            form.setFieldValue('endDate', '');
        } else {
            const [earlier, later] = a <= b ? [a, b] : [b, a];
            form.setFieldValue('startDate', earlier);
            form.setFieldValue('endDate', earlier === later ? '' : later);
        }
        form.validate();
    };

    const formatDateRangeValue: DateFormatter = ({ type, date, locale, format }) => {
        if (type !== 'range' || !Array.isArray(date)) return '';

        const [start, end] = date;
        if (!start) return '';

        const startLabel = dayjs(start).locale(locale).format(format);
        if (!end || dayjs(end).isSame(start, 'day')) {
            return startLabel;
        }

        return `${startLabel} \u2013 ${dayjs(end).locale(locale).format(format)}`;
    };

    const validateOnChange = <Key extends keyof EventFormValues>(
        path: Key,
        options?: Parameters<typeof form.getInputProps>[1]
    ) => (value: any) => {
        form.getInputProps(path, options).onChange(value);
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
                    modalProps={{ zIndex: getDefaultZIndex('popover') }}
                    placeholder="Select event date(s)"
                    label="Date"
                    description="Select a single date, or create a range (start and end dates)."
                    required
                    leftSection={<CalendarMonthRoundedIcon />}
                    leftSectionWidth="40px"
                    color="rgb(5, 5, 73)"
                    styles={DATE_PICKER_STYLES}
                    firstDayOfWeek={0}
                    clearable={!!form.getValues().endDate}
                    valueFormatter={formatDateRangeValue}
                />
            </Group>
            <Checkbox
                {...form.getInputProps('allDay', { type: 'checkbox' })}
                key={form.key('allDay')}
                label="All Day"
                onChange={validateOnChange('allDay', { type: 'checkbox' })}
                color="rgb(5, 5, 73)"
            />
        </>
    )
}