import { Popover, Button } from "@mantine/core";

type Props = {
    icon: React.ReactNode;
    name: string;
    dropdown: React.ReactNode;
    opened: boolean;
    onChange: (opened: boolean) => void;
}
export const DetailPopover = ({ icon, name, dropdown, opened, onChange }: Props) => {
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
                >
                    <span className="add-item-detail-icon">
                        {icon}
                    </span>
                    {name}
                </Button>
            </Popover.Target>
            <Popover.Dropdown>
                {dropdown}
            </Popover.Dropdown>
        </Popover>
    )
}