import { ActionIcon, Menu } from "@mantine/core"

import { DeleteConfirmation } from "@/components";
import { useCategoryMenu } from "../hooks";
import { type PersonalNoteCategory } from "@/store/noteCategorySlice";

import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteRounded from '@mui/icons-material/Delete';
import { IoEllipsisVerticalSharp } from "react-icons/io5";


type Props = {
    /** Targeted category */
    category: PersonalNoteCategory,
    /** Edit button's click action */
    onEditClick: (category: PersonalNoteCategory) => void,
}

/**
 * Note category's actions menu (Edit, Delete)
 */
export const CategoryMenu = ({ category, onEditClick }: Props) => {
    const {
        handleDeleteCategory,
        showConfirmDelete,
        setShowConfirmDelete
    } = useCategoryMenu({ category });

    return (
        <>
            <Menu>
                <Menu.Target>
                    <ActionIcon
                        p={0}
                        h="auto"
                        size="xs"
                        variant="transparent"
                        color="gray.6"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <IoEllipsisVerticalSharp />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(category);
                        }}
                        leftSection={
                            <BorderColorRoundedIcon fontSize="small" />
                        }
                    >
                        Edit
                    </Menu.Item>
                    <Menu.Item
                        color="red.9"
                        leftSection={
                            <DeleteRounded fontSize="small" />
                        }
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDelete(true);
                        }}
                    >
                        Delete
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>

            <DeleteConfirmation
                modalTitle="Delete note"
                itemName={category.name}
                itemType="category"
                opened={showConfirmDelete}
                handleDeleteItem={handleDeleteCategory}
                setShowDeleteConfirmation={setShowConfirmDelete}
                zIndex={99999}
            />
        </>
    )
}