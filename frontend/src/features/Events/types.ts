import { type CalendarEvent } from "@/store";
import type { useDayEvents } from "./hooks/useDayEvents";

export type Occurrence = ReturnType<typeof useDayEvents>['occurrences'][number];

export type MemberLike = {
    id: number;
    firstName: string;
    lastName: string;
    color: string;
    profileImg: string | null;
};

export type UserGroup = {
    member: MemberLike;
    events: Occurrence[];
};

export type DayEventRowSharedProps = {
    onEdit: (event: CalendarEvent) => void;
    openDotId: string | null;
    onOpenDot: (id: string) => void;
};

export type ModalId = 'recurrence' | 'event-form' | 'events-list';
