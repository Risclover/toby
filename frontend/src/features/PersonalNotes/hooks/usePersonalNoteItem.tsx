import { useParams } from "react-router-dom";
import { useAuthenticateQuery, useToggleNoteFavoriteMutation, type PersonalNote } from "@/store";
import { parseNoteContent } from "../utils";

type UsePersonalNoteItemProps = {
    /** The note being displayed */
    note: PersonalNote
}

/** Hook for logic from PersonalNoteGridItem and PersonalNoteListItem */
export const usePersonalNoteItem = ({ note }: UsePersonalNoteItemProps) => {
    const { text, images } = parseNoteContent(note.body);
    const [toggleNoteFavorite] = useToggleNoteFavoriteMutation();
    const { data: currentUser } = useAuthenticateQuery();
    const { userId } = useParams();

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        await toggleNoteFavorite(note.id).unwrap();
    }

    return {
        text,
        images,
        handleToggleFavorite,
        isOwner,
    }
}