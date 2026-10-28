import { Group, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { toDotCssColor } from "../../utils/cssColors";
import type { HouseholdMemberColor } from "../../utils/eventColorPayload";
import { toEventMember } from "../../utils/getEventColors";
import { MemberTooltipLabel } from "./MemberTooltipLabel";

type Props = {
    members: HouseholdMemberColor[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onToggleAll: () => void;
};

export function MemberFilterRow({ members, selectedIds, onToggle, onToggleAll }: Props) {
    const isAllSelected = members.length > 0 && members.every((member) => selectedIds.includes(member.id));

    return (
        <Group gap={6}>
            {members.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                const { name, profileImg } = toEventMember(member);

                return (
                    <Tooltip
                        key={member.id}
                        label={<MemberTooltipLabel member={{ name, profileImg }} />}
                        withArrow
                        events={{ hover: true, focus: true, touch: true }}
                    >
                        <UnstyledButton
                            onClick={() => onToggle(member.id)}
                            aria-label={name}
                            aria-pressed={isSelected}
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: toDotCssColor(member.color),
                                opacity: isSelected ? 1 : 0.3,
                                border: isSelected ? "2px solid var(--mantine-color-dark-7)" : "2px solid transparent",
                                transition: "opacity 120ms ease, border-color 120ms ease",
                            }}
                        />
                    </Tooltip>
                );
            })}
            <div style={{ width: 1, height: 16, background: "var(--mantine-color-gray-3)", margin: "0 2px" }} />
            <UnstyledButton
                onClick={onToggleAll}
                aria-label="All"
                aria-pressed={isAllSelected}
                style={{ padding: "2px 0" }}
            >
                <Text size="xs" fw={500} c="blue.9">
                    {isAllSelected ? "Clear all" : "Select all"}
                </Text>
            </UnstyledButton>
        </Group>
    );
}