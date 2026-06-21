import { Popover, Button, ActionIcon, CloseIcon } from "@mantine/core";

type Props = {
    icon: React.ReactNode;
    name: string;
    dropdown: React.ReactNode;
    opened: boolean;
    onChange: (opened: boolean) => void;
    onCommit: (finalValue: number) => void;
    onClose: (finalValue: number) => void;
}
export const DetailPopover = ({ icon, name, dropdown, opened, onChange, onCommit, onClose }: Props) => {
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
                    {name !== "Qty." && <ActionIcon h="auto" p={0} variant="transparent" size="compact-xs" onClick={(e) => {
                        e.stopPropagation();
                        onCommit(0);
                        onClose(0);
                    }}
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