import { useForm } from "@mantine/form";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";

export type EventVisibility = 'public' | 'private';

export interface EventFormValues {
    title: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string;   // "YYYY-MM-DD" | ""
    allDay: boolean;
    startTime: string; // "HH:mm" | ""
    endTime: string;   // "HH:mm" | ""
    visibility: string;
    allMembers: boolean;
    assignedUserIds: number[];
}

interface UseEventFormArgs {
    currentUserId: number;
    startDate: string;
}

const TIME_FORMAT = 'HH:mm'; // 'HH:mm:ss' if TimeInput has withSeconds
const THIRTY_MIN_MS = 30 * 60 * 1000;
const DEFAULT_EVENT_DURATION_HOURS = 1;

export function useEventForm({ currentUserId, startDate }: UseEventFormArgs) {

    const [allDay, setAllDay] = useState(true);
    const [startDateValue, setStartDateValue] = useState(startDate);
    const [title, setTitle] = useState('');

    const [allMembers, setAllMembers] = useState(false);
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([currentUserId]);

    const roundUpToNearest30Min = (time: Dayjs): Dayjs => {
        const msSinceMidnight = time.diff(time.startOf('day'));
        const roundedMs = Math.ceil(msSinceMidnight / THIRTY_MIN_MS) * THIRTY_MIN_MS;
        return time.startOf('day').add(roundedMs, 'millisecond');
    };

    // Computed once, used to seed the form's initial values
    const defaultStartTime = roundUpToNearest30Min(dayjs());
    const defaultEndTime = defaultStartTime.add(DEFAULT_EVENT_DURATION_HOURS, 'hour');

    const form = useForm<EventFormValues>({
        mode: 'uncontrolled',
        initialValues: {
            title: '',
            startDate,
            endDate: '',
            allDay: true,
            startTime: defaultStartTime.format(TIME_FORMAT),
            endTime: defaultEndTime.format(TIME_FORMAT),
            visibility: 'public',
            allMembers: false,
            assignedUserIds: [currentUserId],
        },
        onValuesChange: (values, previous) => {
            if (values.allDay !== previous.allDay) setAllDay(values.allDay);
            if (values.startDate !== previous.startDate) setStartDateValue(values.startDate);
            if (values.title !== previous.title) setTitle(values.title);
            if (values.allMembers !== previous.allMembers) setAllMembers(values.allMembers);
            if (values.assignedUserIds !== previous.assignedUserIds) setAssignedUserIds(values.assignedUserIds);
        },
        validateInputOnChange: ['title', 'startDate', 'endDate', 'allDay', 'startTime', 'endTime', 'assignedUserIds'],
        validate: (values) => {
            const errors: Partial<Record<keyof EventFormValues, string>> = {};


            errors.title = values.title.trim() ? undefined : 'Title is required';

            // Time fields aren't shown or meaningful for all-day events.
            if (values.allDay) {
                errors.startTime = undefined;
                errors.endTime = undefined;
            } else {
                errors.startTime = values.startTime ? undefined : 'Start time is required';
            }

            if (!values.startDate) {
                errors.startDate = 'Start date is required';
            } else if (values.endDate && values.startDate > values.endDate) {
                errors.startDate = "Start date can't be after end date";
            } else {
                errors.startDate = undefined;
            }

            errors.endDate = values.endDate && values.endDate < values.startDate
                ? "End date can't be before start date"
                : undefined;

            if (!values.allDay) {
                errors.startTime = values.startTime ? undefined : 'Start time is required';

                if (!values.endTime) {
                    errors.endTime = 'End time is required';
                } else {
                    const endIsSameDayAsStart = values.endDate ? values.endDate === values.startDate : true;
                    errors.endTime = (
                        endIsSameDayAsStart &&
                        values.startTime &&
                        values.endTime < values.startTime
                    ) ? "End time can't be before start time" : undefined;
                }
            }

            errors.assignedUserIds = (!values.allMembers && values.assignedUserIds.length === 0)
                ? 'You must assign at least one member.'
                : undefined;

            return errors;
        },
    });


    return { form, allDay, startDate: startDateValue, title, allMembers, assignedUserIds };
}