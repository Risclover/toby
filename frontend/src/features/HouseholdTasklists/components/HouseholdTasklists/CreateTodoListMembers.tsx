// CreateTodoListMembers.tsx
import { Avatar, Checkbox, Collapse, Fieldset, Stack } from "@mantine/core";
import type { UserLite } from "@/hooks/useMemberSelection";

type Props = {
    members?: UserLite[];
    allMembers: boolean;
    someSelected: boolean;
    selected: Set<number>;
    onToggleAll: (checked: boolean) => void;
    onToggleOne: (id: number) => void;
};

export function CreateTodoListMembers({
    members,
    allMembers,
    someSelected,
    selected,
    onToggleAll,
    onToggleOne,
}: Props) {
    return (
        <Fieldset legend="Who is this list for?" className="list-is-for">
            <Checkbox
                color="cyan"
                className=""
                size="xs"
                label="All household members"
                checked={allMembers}
                indeterminate={someSelected}
                onChange={(e) => onToggleAll(e.currentTarget.checked)}
            />
            <Collapse in={!allMembers} transitionDuration={180} transitionTimingFunction="ease-in-out">
                {!allMembers && (
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
                )}
            </Collapse>
        </Fieldset>
    );
}
