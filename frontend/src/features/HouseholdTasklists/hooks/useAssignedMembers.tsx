import { useMemo } from "react";

export type AssignedMember = {
    id: number;
    name: string;
    avatarUrl?: string;
};

export function useAssignedMembers(
    householdMembers: any[] | undefined,
    allMembers: boolean,
    memberIds: number[]
) {
    return useMemo(() => {
        if (!householdMembers) return [];

        if (allMembers) {
            return householdMembers;
        }

        return householdMembers.filter((m) => memberIds?.includes(m.id));
    }, [householdMembers, allMembers, memberIds]);
}
