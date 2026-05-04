import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Menu } from "@mantine/core"

import { KittyNotification, DeleteConfirmation } from "@/components";
import { usePersonalNoteModal } from "@/contexts";
import { useDeleteNoteMutation, type PersonalNote } from "@/store";

import { IoEllipsisVerticalSharp } from "react-icons/io5";
import DeleteRounded from '@mui/icons-material/Delete';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import { KittyIcons } from "@/assets";

export const PersonalNoteMenu = ({ note }: { note: PersonalNote }) => {
    const { userId } = useParams();
    const { openModal } = usePersonalNoteModal();
    const navigate = useNavigate();
    const [deleteNote] = useDeleteNoteMutation();
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleDeleteNote = async () => {
        try {
            await deleteNote(note.id).unwrap();
            setShowConfirmDelete(false);
            navigate(`/profile/${userId}?tab=notes`);
            KittyNotification({
                title: "Note deleted",
                message: <>Done - "<strong style={{ fontWeight: 500 }}>{note?.title}</strong>" has been removed from your notes. Later, gator!</>,
                color: "green",
                icon: KittyIcons.Bubbles
            });
        } catch (error) {
            KittyNotification({
                title: "Shoot, I messed up!",
                message: <>Couldn't delete "<strong style={{ fontWeight: 500 }}>{note?.title}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Grumpy
            });
            console.error("Failed to delete note:", error);
        }

    }

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
            <DeleteConfirmation modalTitle="Delete note" itemName={note.title} itemType="note" opened={showConfirmDelete} handleDeleteItem={handleDeleteNote} setShowDeleteConfirmation={setShowConfirmDelete} />
        </>
    )
}