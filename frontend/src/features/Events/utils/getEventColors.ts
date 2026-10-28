import type { CalendarEvent } from "@/store";
import { formatFullName } from "@/utils/formatFullName";

import { DEFAULT_EVENT_COLOR } from "./calendarConstants";
import type { EventMember, HouseholdMemberColor } from "./eventColorPayload";

export function getAssignedMembers(
    event: Pick<CalendarEvent, "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): HouseholdMemberColor[] {
    const assignedIds = event.allMembers ? members.map((m) => m.id) : event.attendeeIds ?? [];
    const byId = new Map(members.map((m) => [m.id, m]));
    return assignedIds.map((id) => byId.get(id)).filter((m): m is HouseholdMemberColor => Boolean(m));
}

export function getEventColors(
    event: Pick<CalendarEvent, "color" | "attendeeIds" | "allMembers">,
    members: HouseholdMemberColor[]
): string[] {
    const assigned = getAssignedMembers(event, members);
    return assigned.length > 0 ? assigned.map((m) => m.color) : [event.color ?? DEFAULT_EVENT_COLOR];
}

/** Display name and avatar for a member dot's tooltip. */
export const toEventMember = (member: HouseholdMemberColor): EventMember => ({
    name: formatFullName(member),
    profileImg: member.profileImg,
});