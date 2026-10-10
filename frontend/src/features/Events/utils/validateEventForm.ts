import type { EventFormValues } from "./eventFormValues";

const ERRORS = {
    titleRequired: "Title is required",
    startDateRequired: "Start date is required",
    startAfterEndDate: "Start date can't be after end date",
    endBeforeStartDate: "End date can't be before start date",
    startTimeRequired: "Start time is required",
    endTimeRequired: "End time is required",
    endBeforeStartTime: "End time can't be before start time",
    noAssignees: "You must assign at least one member.",
} as const;

export type EventFormErrors = Partial<Record<keyof EventFormValues, string>>;

const validateTitle = ({ title }: EventFormValues) =>
    title.trim() ? undefined : ERRORS.titleRequired;

const validateStartDate = ({ startDate, endDate }: EventFormValues) => {
    if (!startDate) return ERRORS.startDateRequired;
    return endDate && startDate > endDate ? ERRORS.startAfterEndDate : undefined;
};

const validateEndDate = ({ startDate, endDate }: EventFormValues) =>
    endDate && endDate < startDate ? ERRORS.endBeforeStartDate : undefined;

// Time fields aren't shown or meaningful for all-day events.
const validateStartTime = ({ allDay, startTime }: EventFormValues) =>
    !allDay && !startTime ? ERRORS.startTimeRequired : undefined;

const validateEndTime = ({ allDay, startDate, endDate, startTime, endTime }: EventFormValues) => {
    if (allDay) return undefined;
    if (!endTime) return ERRORS.endTimeRequired;

    const endsOnStartDay = endDate ? endDate === startDate : true;
    return endsOnStartDay && startTime && endTime < startTime ? ERRORS.endBeforeStartTime : undefined;
};

const validateAssignees = ({ allMembers, assignedUserIds }: EventFormValues) =>
    !allMembers && assignedUserIds.length === 0 ? ERRORS.noAssignees : undefined;

export const validateEventForm = (values: EventFormValues): EventFormErrors => ({
    title: validateTitle(values),
    startDate: validateStartDate(values),
    endDate: validateEndDate(values),
    startTime: validateStartTime(values),
    endTime: validateEndTime(values),
    assignedUserIds: validateAssignees(values),
});