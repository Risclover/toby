import { useState } from "react";

import { useForm } from "@mantine/form";
import { DEFAULT_VISIBILITY, getBlankFormValues, type EventFormValues } from "../utils/eventFormValues";
import { validateEventForm } from "../utils/validateEventForm";


const VALIDATE_ON_CHANGE = [
    "title",
    "startDate",
    "endDate",
    "allDay",
    "startTime",
    "endTime",
    "assignedUserIds",
] satisfies (keyof EventFormValues)[];

type UseEventFormProps = {
    currentUserId: number;
    startDate: string;
};

export function useEventForm({ currentUserId, startDate }: UseEventFormProps) {
    const [allDay, setAllDay] = useState(true);
    const [startDateValue, setStartDateValue] = useState(startDate);
    const [title, setTitle] = useState("");
    const [allMembers, setAllMembers] = useState(false);
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([currentUserId]);

    const form = useForm<EventFormValues>({
        mode: "uncontrolled",
        initialValues: getBlankFormValues({
            date: startDate,
            userId: currentUserId,
            visibility: DEFAULT_VISIBILITY,
        }),
        onValuesChange: (values, previous) => {
            if (values.allDay !== previous.allDay) setAllDay(values.allDay);
            if (values.startDate !== previous.startDate) setStartDateValue(values.startDate);
            if (values.title !== previous.title) setTitle(values.title);
            if (values.allMembers !== previous.allMembers) setAllMembers(values.allMembers);
            if (values.assignedUserIds !== previous.assignedUserIds) setAssignedUserIds(values.assignedUserIds);
        },
        validateInputOnChange: VALIDATE_ON_CHANGE,
        validate: validateEventForm,
    });

    return { form, allDay, startDate: startDateValue, title, allMembers, assignedUserIds };
}