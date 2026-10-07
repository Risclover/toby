import { Group, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { toDotCssColor } from "../../utils/getEventColors";

type Member = {
    id: number;
    color: string;
    firstName: string;
};

type Props = {
    members: Member[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onToggleAll: () => void;
};

/**
 * One colored chip per household member, reusing the same per-member
 * color already used for event dots elsewhere. Click to toggle that
 * member's events in/out of the calendar (both the Agenda list and the
 * main Month/Week/Day grid share this same filter state). A deselected
 * chip dims rather than disappears, so it stays clickable to re-select.
 *
 * The trailing "All" text toggles the whole row at once: dark + underlined
 * when every member is currently selected, dimmed and plain otherwise
 * (including a partial selection - it only reads as "on" when literally
 * everyone is selected). Text rather than a colored circle deliberately -
 * a circle chip in the same style as the member dots implied "All" was
 * another selectable member/color, and there wasn't room to fit the word
 * legibly at that size anyway. Clicking it hands off to onToggleAll, which
 * owns the actual select-all/deselect-all decision (it needs the full
 * member id list to do that, which this component doesn't otherwise need
 * to know).
 */
export function MemberFilterRow({ members, selectedIds, onToggle, onToggleAll }: Props) {
    const isAllSelected = members.length > 0 && members.every((member) => selectedIds.includes(member.id));

    return (
        <Group gap={6}>
            {members.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                    <Tooltip
                        key={member.id}
                        label={member.firstName}
                        withArrow
                        events={{ hover: true, focus: true, touch: true }}
                    >
                        <UnstyledButton
                            onClick={() => onToggle(member.id)}
                            aria-label={member.firstName}
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
                <Text
                    size="xs"
                    fw={500}
                    c="blue.9"
                >
                    {isAllSelected ? "Clear all" : "Select all"}
                </Text>
            </UnstyledButton>
        </Group>
    );
}