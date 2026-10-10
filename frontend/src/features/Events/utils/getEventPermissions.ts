import type { EventSource } from "./calendarTypes";

type EventPermissionsProps = {
    source: EventSource;
    userId: number;
};

export const getEventPermissions = ({ source, userId }: EventPermissionsProps) => {
    const canEdit = source.household?.adminId === userId || source.creatorId === userId;
    const canLeave = source.attendeeIds.includes(userId);

    return { canEdit, canLeave, canOpenMenu: canEdit || canLeave };
};