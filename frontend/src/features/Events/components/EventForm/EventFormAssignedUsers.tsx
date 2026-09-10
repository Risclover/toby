import type { HouseholdMember } from "@/components/MembersModal";
import { Avatar, Checkbox, Group, Input, InputWrapper, MultiSelect, Stack, Text, type MultiSelectProps } from "@mantine/core"
import { useId } from "@mantine/hooks";
import { useMemo } from "react";
import type { EventFormValues } from "../../hooks/useEventForm";
import type { FormErrors, UseFormReturnType } from "@mantine/form";

type Props = {
    form: UseFormReturnType<EventFormValues, EventFormValues, (values: EventFormValues) => FormErrors>;
    household: {
        members: HouseholdMember[];
    }
}

export const EventFormAssignedUsers = ({ form, household }: Props) => {
    const titleId = useId();

    const allHouseholdMemberIds = useMemo(
        () => household?.members?.map((m: { id: number }) => m.id) ?? [],
        [household]
    );

    const memberOptions = useMemo(
        () => household?.members?.map((member: { id: number; firstName: string; lastName: string }) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
        })) ?? [],
        [household]
    );

    const memberAvatars = useMemo(() => Object.fromEntries(
        household?.members?.map((member: { id: number; profileImg?: string | null }) => [String(member.id), member.profileImg]) ?? []
    ), [household]);

    const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({ option }) => (
        <Group gap="sm">
            <Avatar src={memberAvatars[option.value]} size="sm" radius="xl" />
            <Text size="sm">{option.label}</Text>
        </Group>
    );

    const handleMemberChange = (values: string[]) => {
        const ids = values.map(Number);
        form.setFieldValue('assignedUserIds', ids);
        form.setFieldValue('allMembers', ids.length > 0 && ids.length === allHouseholdMemberIds.length);
        form.validate();
    };
    const handleToggleAllMembers = (checked: boolean) => {
        form.setFieldValue('allMembers', checked);
        form.setFieldValue('assignedUserIds', checked ? allHouseholdMemberIds : []);
        form.validate();
    };

    return (
        <div className="event-form-repeat-custom--vertical-section">
            <InputWrapper>
                <Stack gap="xs">
                    <div>
                        <Stack gap={0}>
                            <Input.Label required htmlFor={titleId}>Assigned members</Input.Label>
                            <span className="event-form-input--error">{form.errors.assignedUserIds}</span>
                            <MultiSelect
                                id={titleId}
                                data={memberOptions}
                                value={form.getValues().assignedUserIds.map(String)}
                                onChange={handleMemberChange}
                                renderOption={renderMultiSelectOption}
                                maxDropdownHeight={300}
                                placeholder="Assign members"
                                hidePickedOptions
                                clearable
                                c="black"
                            />
                        </Stack>
                    </div>
                    <Checkbox
                        label="All members"
                        checked={form.getValues().allMembers}
                        onChange={(e) => handleToggleAllMembers(e.currentTarget.checked)}
                        color="rgb(5, 5, 73)"
                        size="sm"
                    />
                </Stack>
            </InputWrapper>
        </div>
    )
}