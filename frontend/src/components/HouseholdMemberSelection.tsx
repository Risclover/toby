// CreateTasklistMembers.tsx
import { Avatar, Checkbox, Collapse, Fieldset, Stack } from "@mantine/core";
import type { UserLite } from "@/hooks/useMemberSelection";

type Props = {
    title: string;
    members?: UserLite[];
    allMembers: boolean;
    someSelected: boolean;
    selected: Set<number>;
    onToggleAll: (checked: boolean) => void;
    onToggleOne: (id: number) => void;
};

export function HouseholdMemberSelection({
    title,
    members,
    allMembers,
    someSelected,
    selected,
    onToggleAll,
    onToggleOne,
}: Props) {
    return (
        <Fieldset legend={title} className="list-is-for">
            <Checkbox
                color="cyan"
                size="xs"
                label="All household members"
                checked={allMembers} // This will now correctly show as checked
                indeterminate={someSelected}
                onChange={(e) => onToggleAll(e.currentTarget.checked)}
            />
            {/* Remove the !allMembers short-circuit inside here */}
            <Collapse in={!allMembers} transitionDuration={180}>
                <div className="gap-4 mt-4">
                    <Stack gap="xs" ml="lg">
                        {members?.map((m) => (
                            <Checkbox
                                color="cyan"
                                key={m.id}
                                size="xs"
                                label={
                                    <div className="list-members">
                                        <Avatar src={m.profileImg} size="xs" />
                                        <span>{m.displayName}</span>
                                    </div>
                                }
                                checked={selected.has(m.id)}
                                onChange={() => onToggleOne(m.id)}
                            />
                        ))}
                    </Stack>
                </div>
            </Collapse>
        </Fieldset>
    );
}