import { ArchivedIcon } from "@/assets";
import { CopyIcon } from "@/assets/icons/CopyIcon";
import { ActionIcon, Menu, Tooltip } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteRounded from '@mui/icons-material/Delete';
import { FaTrash } from "react-icons/fa";
import { FaCopy } from "react-icons/fa";
import { useArchiveShoppingListMutation, type ShoppingList } from "@/store";
import { useHousehold } from "@/hooks/useHousehold";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

type Props = {
    list: ShoppingList;
}
export const ShoppingListActionsMenu = ({ list }: Props) => {
    const { data: household } = useHousehold();
    const [archiveList] = useArchiveShoppingListMutation();

    const handleArchiveList = async () => {
        try {
            await archiveList({ listId: list.id, householdId: household?.id }).unwrap();
            KittyNotification({
                title: "Successfully archived shopping list",
                message: <>The shopping list "<strong style={{ fontWeight: 500 }}>{list.title}</strong>" was tucked away into storage.</>,
                color: "green",
                icon: KittyIcons.Bubbles
            })
        } catch (err) {
            console.error("Failed to archive shopping list:", err);
        }
    }

    return (
        <div className="menu-wrapper"
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                }
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Menu
                loop={false}
                withinPortal={false}
                trapFocus={false}
                menuItemTabIndex={0}
                shadow="md"
                width={150}
            >
                <Tooltip withArrow label="Shopping list actions">
                    <Menu.Target>
                        <ActionIcon variant="transparent" color="var(--mantine-color-gray-6)" size="xs" onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                            }
                        }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        >
                            <MoreVertRoundedIcon fontSize="small" />
                        </ActionIcon>
                    </Menu.Target>
                </Tooltip>
                <Menu.Dropdown>
                    <Menu.Item tabIndex={0} leftSection={<div className="archived-menu-icon"><ArchivedIcon size="20px" color="var(--mantine-color-gray-8)" /></div>}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveList();
                        }}>
                        Archive
                    </Menu.Item>
                    <Menu.Item
                        leftSection={
                            <div className="archived-menu-icon">
                                <FaCopy fontSize="16px" />
                            </div>
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        Duplicate
                    </Menu.Item>
                    <Menu.Item
                        color="red.9"
                        leftSection={
                            <FaTrash fontSize="1rem" />
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        Delete
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div>
    )
}