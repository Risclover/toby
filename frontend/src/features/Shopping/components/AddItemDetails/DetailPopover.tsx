import { Popover, Button, ActionIcon, CloseIcon } from "@mantine/core";

type Props = {
    /** Button icon */
    icon: React.ReactNode;
    /** Button label */
    name: string;
    /** Dropdown content */
    dropdown: React.ReactNode;
    /** Whether or not popover is open */
    opened: boolean;
    /** Callback for when popover open state changes */
    onChange: (opened: boolean) => void;
    /** Callback for when popover is committed */
    onCommit: (finalValue: number) => void;
    /** Callback for when popover is closed */
    onClose: (finalValue: number) => void;
}

/** A popover component for displaying detail options */
export const DetailPopover = ({ icon, name, dropdown, opened, onChange, onCommit, onClose }: Props) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onCommit(0);
        onClose(0);
    }
    return (
        <Popover opened={opened} onChange={onChange} trapFocus position="top" shadow="sm" withinPortal={false}>
            <Popover.Target>
                <Button
                    h="auto"
                    p=".25rem .5rem"
                    variant="transparent"
                    size="13px"
                    fw={500}
                    color="var(--mantine-color-gray-7)"
                    className="shopping-list-add-item-detail"
                    onClick={() => onChange(!opened)}
                    style={{
                        flexShrink: 0
                    }}
                >
                    <span className="add-item-detail-icon">
                        {icon}
                    </span>
                    {name}
                    {name !== "Qty." &&
                        <ActionIcon
                            h="auto"
                            p={0}
                            variant="transparent"
                            size="compact-xs"
                            onClick={handleClick}
                            ml=".25rem"
                            style={{ flexShrink: 0 }}
                        >
                            <CloseIcon size=".9rem" color="var(--mantine-color-gray-6)" />
                        </ActionIcon>}
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                {dropdown}
            </Popover.Dropdown>
        </Popover>
    )
}