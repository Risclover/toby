import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePersonalNoteModal } from "@/contexts";
import { useDeleteNoteMutation, type PersonalNote } from "@/store";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

// ─── Types ────────────────────────────────────────────────────────────────────

type UsePersonalNoteMenuProps = {
    /** The note this menu belongs to */
    note: PersonalNote;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Manages state and logic for the note menu's edit and delete actions */
export const usePersonalNoteMenu = ({ note }: UsePersonalNoteMenuProps) => {
    const { userId } = useParams();
    const { openModal } = usePersonalNoteModal();
    const navigate = useNavigate();
    const [deleteNote] = useDeleteNoteMutation();

    // ── State ─────────────────────────────────────────────────────────────────

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleDeleteNote = async () => {
        try {
            await deleteNote(note.id).unwrap();
            setShowConfirmDelete(false);
            navigate(`/profile/${userId}?tab=notes`);
            KittyNotification({
                title: "Note deleted",
                message: <>Done — "<strong style={{ fontWeight: 500 }}>{note.title}</strong>" has been removed from your notes. Later, gator!</>,
                color: "green",
                icon: KittyIcons.Bubbles,
            });
        } catch (error) {
            KittyNotification({
                title: "Shoot, I messed up!",
                message: <>Couldn't delete "<strong style={{ fontWeight: 500 }}>{note.title}</strong>". Try again.</>,
                color: "red",
                icon: KittyIcons.Grumpy,
            });
            console.error("Failed to delete note:", error);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────

    return {
        openModal,
        showConfirmDelete,
        setShowConfirmDelete,
        handleDeleteNote,
    };
};