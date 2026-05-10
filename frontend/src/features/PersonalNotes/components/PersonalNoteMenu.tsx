import { ActionIcon, Menu } from "@mantine/core"

import { DeleteConfirmation } from "@/components"
import { usePersonalNoteMenu } from "../hooks";
import { type PersonalNote } from "@/store";

import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';

type Props = {
    /** Note for which this menu is for */
    note: PersonalNote;
}

/** Menu for a note ('edit' and 'delete' options) */
export const PersonalNoteMenu = ({ note }: Props) => {
    const {
        openModal,
        showConfirmDelete,
        setShowConfirmDelete,
        handleDeleteNote
    } = usePersonalNoteMenu({ note })
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
                            openModal({
                                id: note.id,
                                title: note.title,
                                body: note.body,
                                categoryId: note.categoryId,
                                isPrivate: note.isPrivate
                            });
                        }}
                        leftSection={<BorderColorRoundedIcon fontSize="small" />}
                    >
                        Edit
                    </Menu.Item>
                    <Menu.Item
                        color="red.9"
                        leftSection={<DeleteRounded fontSize="small" />}
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
                itemName={note.title}
                itemType="note"
                opened={showConfirmDelete}
                handleDeleteItem={handleDeleteNote}
                setShowDeleteConfirmation={setShowConfirmDelete}
            />
        </>
    )
}