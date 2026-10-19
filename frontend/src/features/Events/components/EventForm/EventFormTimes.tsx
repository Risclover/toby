import type { RefObject } from "react";
import dayjs from "dayjs";
import { Group } from "@mantine/core";
import { TimePicker } from "@mantine/dates";
import { DEFAULT_EVENT_DURATION_HOURS, TIME_FORMAT } from "../../utils";
import type { EventFormInstance } from "../../types";
import { ClockIcon } from "@/assets";

const SHARED_TIME_PICKER_PROPS = {
    leftSection: <ClockIcon color="var(--primary)" size="1.25rem" />,
    withDropdown: true,
    minutesStep: 5,
    hoursStep: 1,
    format: "12h",
} as const;

type Props = {
    form: EventFormInstance;
    /** True once the user has edited the end time themselves; stops auto-filling it from the start time. */
    endTimeManuallySetRef: RefObject<boolean>;
};

export const EventFormTimes = ({ form, endTimeManuallySetRef }: Props) => {
    const isAllDay = form.getValues().allDay;

    const handleStartTimeChange = (value: string) => {
        form.setFieldValue("startTime", value);

        if (value && !endTimeManuallySetRef.current) {
            const defaultEndTime = dayjs(value, TIME_FORMAT)
                .add(DEFAULT_EVENT_DURATION_HOURS, "hour")
                .format(TIME_FORMAT);
            form.setFieldValue("endTime", defaultEndTime);
        }

        form.validate();
    };

    const handleEndTimeChange = (value: string) => {
        endTimeManuallySetRef.current = true;
        form.setFieldValue("endTime", value);
        form.validate();
    };

    return (
        <Group grow align="flex-start">
            <TimePicker
                {...SHARED_TIME_PICKER_PROPS}
                {...form.getInputProps("startTime")}
                key={form.key("startTime")}
                label="Start time"
                disabled={isAllDay}
                required={!isAllDay}
                onChange={handleStartTimeChange}
            />
            <TimePicker
                {...SHARED_TIME_PICKER_PROPS}
                {...form.getInputProps("endTime")}
                key={form.key("endTime")}
                label="End time"
                disabled={isAllDay}
                required={!isAllDay}
                onChange={handleEndTimeChange}
            />
        </Group>
    );
};