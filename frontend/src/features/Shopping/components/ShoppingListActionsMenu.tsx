import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActionIcon, Button, Group, Menu, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { KittyNotification, DeleteConfirmation } from "@/components";
import {
    useArchiveShoppingListMutation,
    useCheckAllItemsMutation,
    useUncheckAllItemsMutation,
    useDuplicateShoppingListMutation,
    useDeleteShoppingListMutation,
    type ShoppingList,
} from "@/store";
import { useHousehold } from "@/hooks";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { FaTrash, FaCopy } from "react-icons/fa";
import { KittyIcons, ArchivedIcon } from "@/assets";

type Props = {
    list: ShoppingList;
};

export const ShoppingListActionsMenu = ({ list }: Props) => {
    const navigate = useNavigate();
    const { data: household } = useHousehold();
    const [archiveList] = useArchiveShoppingListMutation();
    const [checkAll] = useCheckAllItemsMutation();
    const [uncheckAll] = useUncheckAllItemsMutation();
    const [duplicateList] = useDuplicateShoppingListMutation();
    const [deleteList] = useDeleteShoppingListMutation();
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const handleCheckAll = async () => {
        try {
            await checkAll({ listId: list.id, householdId: household.id }).unwrap();
            notifications.show({
                color: list.color,
                position: "bottom-center",
                autoClose: 5000,
                message: (
                    <Group justify="space-between" w="100%">
                        <span>All items checked.</span>
                        <Button
                            color={list.color}
                            variant="filled"
                            size="compact-xs"
                            styles={{ label: { fontWeight: 400 } }}
                            onClick={handleUncheckAll}
                        >
                            Undo
                        </Button>
                    </Group>
                ),
            });
        } catch {
            KittyNotification({ title: "Error", message: "Failed to check all items.", color: "red", icon: KittyIcons.Bubbles });
        }
    };

    const handleUncheckAll = async () => {
        try {
            await uncheckAll({ listId: list.id, householdId: household.id }).unwrap();
            notifications.show({
                color: list.color,
                position: "bottom-center",
                autoClose: 5000,
                message: (
                    <Group justify="space-between" w="100%">
                        <span>All items unchecked.</span>
                        <Button
                            color={list.color}
                            variant="filled"
                            size="compact-xs"
                            styles={{ label: { fontWeight: 400 } }}
                            onClick={handleCheckAll}
                        >
                            Undo
                        </Button>
                    </Group>
                ),
            });
        } catch {
            KittyNotification({ title: "Error", message: "Failed to uncheck all items.", color: "red", icon: KittyIcons.Bubbles });
        }
    };

    const handleArchiveList = async () => {
        try {
            await archiveList({ listId: list.id, householdId: household?.id }).unwrap();
            KittyNotification({
                title: "Successfully archived shopping list",
                message: <>The shopping list "<strong style={{ fontWeight: 500 }}>{list.title}</strong>" was tucked away into storage.</>,
                color: "green",
                icon: KittyIcons.Bubbles,
            });
        } catch {
            KittyNotification({ title: "Error", message: "Failed to archive list.", color: "red", icon: KittyIcons.Bubbles });
        }
    };

    const handleDuplicateList = async () => {
        try {
            await duplicateList({ listId: list.id, householdId: household?.id }).unwrap();
            KittyNotification({
                title: "List duplicated",
                message: <>"{list.title}" was duplicated successfully.</>,
                color: "green",
                icon: KittyIcons.Bubbles,
            });
        } catch {
            KittyNotification({ title: "Error", message: "Failed to duplicate list.", color: "red", icon: KittyIcons.Bubbles });
        }
    };

    const handleDeleteList = async () => {
        try {
            await deleteList({ listId: list.id, householdId: household?.id }).unwrap();
            setShowDeleteConfirmation(false);
            navigate("/shopping");
        } catch {
            KittyNotification({ title: "Error", message: "Failed to delete list.", color: "red", icon: KittyIcons.Bubbles });
        }
    };

    return (
        <div
            className="menu-wrapper"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
        >
            <Menu loop={false} withinPortal={false} trapFocus={false} menuItemTabIndex={0} shadow="md" width={175}>
                <Tooltip withArrow label="Shopping list actions">
                    <Menu.Target>
                        <ActionIcon
                            variant="transparent"
                            color="var(--mantine-color-gray-6)"
                            size="xs"
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <MoreVertRoundedIcon fontSize="small" />
                        </ActionIcon>
                    </Menu.Target>
                </Tooltip>
                <Menu.Dropdown>
                    <Menu.Item
                        leftSection={<CheckCircleOutlineRoundedIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); handleCheckAll(); }}
                    >
                        Check all
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<RadioButtonUncheckedRoundedIcon fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); handleUncheckAll(); }}
                    >
                        Uncheck all
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                        leftSection={<div className="archived-menu-icon"><ArchivedIcon size="20px" color="var(--mantine-color-gray-8)" /></div>}
                        onClick={(e) => { e.stopPropagation(); handleArchiveList(); }}
                    >
                        Archive
                    </Menu.Item>
                    <Menu.Item
                        leftSection={<div className="archived-menu-icon"><FaCopy fontSize="16px" /></div>}
                        onClick={(e) => { e.stopPropagation(); handleDuplicateList(); }}
                    >
                        Duplicate
                    </Menu.Item>
                    <Menu.Item
                        color="red.9"
                        leftSection={<FaTrash fontSize="1rem" />}
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirmation(true); }}
                    >
                        Delete
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
            <DeleteConfirmation
                itemName={list.title}
                itemType="shopping list"
                modalTitle="Confirm delete shopping list"
                opened={showDeleteConfirmation}
                setShowDeleteConfirmation={setShowDeleteConfirmation}
                handleDeleteItem={handleDeleteList}
            />
        </div>
    );
};