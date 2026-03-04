// CreateTasklistMembers.tsx
import { Avatar, Checkbox, Collapse, Fieldset, Stack } from "@mantine/core";
import type { UserLite } from "@/hooks/useMemberSelection";

type Props = {
    required?: boolean;
    title: string;
    members?: UserLite[];
    allMembers: boolean;
    someSelected: boolean;
    selected: Set<number>;
    onToggleAll: (checked: boolean) => void;
    onToggleOne: (id: number) => void;
};

export function HouseholdMemberSelection({
    required,
    title,
    members,
    allMembers,
    someSelected,
    selected,
    onToggleAll,
    onToggleOne,
}: Props) {
    const legend = required ? (
        <div style={{ margin: "0 4px" }}>
            {title}
            <span style={{ color: "var(--mantine-color-red-6)", marginLeft: 4 }}>*</span>
        </div>
    ) : title;

    return (
        <Fieldset legend={legend} className="list-is-for">
            <Checkbox
                color="rgb(5, 5, 73)"
                size="sm"
                label="All household members"
                checked={allMembers} // This will now correctly show as checked
                indeterminate={someSelected}
                onChange={(e) => onToggleAll(e.currentTarget.checked)}

            />
            {/* Remove the !allMembers short-circuit inside here */}
            <Collapse in={!allMembers} transitionDuration={180}>
                <div className="gap-4 mt-2">
                    <Stack gap="xs" ml="lg">
                        {members?.map((m) => (
                            <Checkbox
                                color="rgb(5, 5, 73)"
                                key={m.id}
                                size="sm"
                                label={
                                    <div className="list-members">
                                        <Avatar src={m.profileImg} size={20} />
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