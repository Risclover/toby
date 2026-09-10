import { Group } from "@mantine/core"
import { TimePicker } from "@mantine/dates"
import { ClockIcon } from "@/assets";
import { DEFAULT_EVENT_DURATION_HOURS, TIME_FORMAT } from "./EventForm";
import type { RefObject } from "react";
import dayjs from "dayjs";

type Props = {
    form: any;
    endTimeManuallySetRef: RefObject<boolean>;
}

export const EventFormTimes = ({ form, endTimeManuallySetRef }: Props) => {
    const handleStartTimeChange = (value: string) => {
        form.setFieldValue('startTime', value);

        if (value && !endTimeManuallySetRef.current) {
            const newEndTime = dayjs(value, TIME_FORMAT)
                .add(DEFAULT_EVENT_DURATION_HOURS, 'hour')
                .format(TIME_FORMAT);
            form.setFieldValue('endTime', newEndTime);
        }

        form.validate();
    };

    const handleEndTimeChange = (value: string) => {
        endTimeManuallySetRef.current = true;
        form.setFieldValue('endTime', value);
        form.validate();
    };


    return (
        <Group grow align="flex-start">
            <TimePicker
                {...form.getInputProps('startTime')}
                key={form.key('startTime')}
                leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                label="Start time"
                disabled={form.getValues().allDay}
                required={!form.getValues().allDay}
                onChange={handleStartTimeChange}
                withDropdown
                minutesStep={5}
                hoursStep={1}
                format="12h"
            />
            <TimePicker
                {...form.getInputProps('endTime')}
                key={form.key('endTime')}
                leftSection={<ClockIcon color="rgb(5, 5, 73)" size="1.25rem" />}
                label="End Time"
                required={!form.getValues().allDay}
                onChange={handleEndTimeChange}
                disabled={form.getValues().allDay}
                withDropdown
                minutesStep={5}
                hoursStep={1}
                format="12h"
            />
        </Group>
    )
}