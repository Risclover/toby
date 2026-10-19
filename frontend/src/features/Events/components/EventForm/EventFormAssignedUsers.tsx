import {
    Avatar,
    Checkbox,
    Group,
    Input,
    InputWrapper,
    MultiSelect,
    Stack,
    Text,
    type MultiSelectProps,
} from "@mantine/core";
import { useId } from "@mantine/hooks";

import type { HouseholdMember } from "@/components";
import { useEventFormAssignedUsers } from "../../hooks";
import type { EventFormInstance } from "../../types";

type Props = {
    form: EventFormInstance;
    household: { members: HouseholdMember[] } | undefined;
};

const MAX_DROPDOWN_HEIGHT = 300;

export const EventFormAssignedUsers = ({ form, household }: Props) => {
    const titleId = useId();
    const {
        memberOptions,
        memberAvatars,
        selectedMemberIds,
        allMembers,
        handleMemberChange,
        handleAllMembersChange,
    } = useEventFormAssignedUsers({ form, members: household?.members });

    const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({ option }) => (
        <Group gap="sm">
            <Avatar src={memberAvatars[option.value]} size="sm" radius="xl" />
            <Text size="sm">{option.label}</Text>
        </Group>
    );

    return (
        <div className="event-form-repeat-custom--vertical-section">
            <InputWrapper>
                <Stack gap="xs">
                    <Stack gap={0}>
                        <Input.Label required htmlFor={titleId}>Assigned members</Input.Label>
                        <span className="event-form-input--error">{form.errors.assignedUserIds}</span>
                        <MultiSelect
                            id={titleId}
                            data={memberOptions}
                            value={selectedMemberIds}
                            onChange={handleMemberChange}
                            renderOption={renderMultiSelectOption}
                            maxDropdownHeight={MAX_DROPDOWN_HEIGHT}
                            placeholder="Assign members"
                            hidePickedOptions
                            clearable
                            c="black"
                        />
                    </Stack>
                    <Checkbox
                        label="All members"
                        checked={allMembers}
                        onChange={handleAllMembersChange}
                        color="navy"
                        size="sm"
                    />
                </Stack>
            </InputWrapper>
        </div>
    );
};