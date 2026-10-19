import { useMemo, type ChangeEvent } from "react";
import type { HouseholdMember } from "@/components";
import type { EventFormInstance } from "../types";

type Props = {
    form: EventFormInstance;
    members: HouseholdMember[] | undefined;
};

export function useEventFormAssignedUsers({ form, members }: Props) {
    const memberIds = useMemo(() => members?.map((member) => member.id) ?? [], [members]);

    const memberOptions = useMemo(
        () => members?.map((member) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
        })) ?? [],
        [members]
    );

    const memberAvatars = useMemo(
        () => Object.fromEntries(members?.map((member) => [String(member.id), member.profileImg]) ?? []),
        [members]
    );

    const { assignedUserIds, allMembers } = form.getValues();

    const handleMemberChange = (values: string[]) => {
        const ids = values.map(Number);
        form.setFieldValue("assignedUserIds", ids);
        form.setFieldValue("allMembers", ids.length > 0 && ids.length === memberIds.length);
        form.validate();
    };

    const handleToggleAllMembers = (checked: boolean) => {
        form.setFieldValue("allMembers", checked);
        form.setFieldValue("assignedUserIds", checked ? memberIds : []);
        form.validate();
    };

    const handleAllMembersChange = (event: ChangeEvent<HTMLInputElement>) =>
        handleToggleAllMembers(event.currentTarget.checked);

    return {
        memberOptions,
        memberAvatars,
        selectedMemberIds: assignedUserIds.map(String),
        allMembers,
        handleMemberChange,
        handleAllMembersChange,
    };
}