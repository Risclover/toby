import { Group, Tooltip, UnstyledButton } from "@mantine/core";
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
};

/**
 * One colored chip per household member, reusing the same per-member
 * color already used for event dots elsewhere. Click to toggle that
 * member's events in/out of the calendar (both the Agenda list and the
 * main Month/Week/Day grid share this same filter state). A deselected
 * chip dims rather than disappears, so it stays clickable to re-select.
 */
export function MemberFilterRow({ members, selectedIds, onToggle }: Props) {
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
            <UnstyledButton
                // onClick={() => onToggle(member.id)}
                aria-label="All"
                // aria-pressed={isSelected}
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    // background: toDotCssColor(member.color),
                    // opacity: isSelected ? 1 : 0.3,
                    // border: "1px solid black",
                    background: "var(--mantine-color-gray-1)",
                    transition: "opacity 120ms ease, border-color 120ms ease",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >All</UnstyledButton>
        </Group>
    );
}