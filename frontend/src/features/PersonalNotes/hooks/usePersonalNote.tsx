import { useParams } from "react-router-dom";
import { useAuthenticateQuery, useGetNoteQuery, useToggleNoteFavoriteMutation } from "@/store";

type UsePersonalNoteProps = {
    /** ID of the displayed note */
    noteId: string;
}

/** Custom hook for PersonalNote component */
export const usePersonalNote = ({ noteId }: UsePersonalNoteProps) => {
    const [toggleNoteFavorite] = useToggleNoteFavoriteMutation();
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: note, isError } = useGetNoteQuery(noteId, { skip: !currentUser || !noteId });

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async () => {
        await toggleNoteFavorite(noteId);
    }

    return {
        handleToggleFavorite,
        note,
        isError,
        isOwner
    }
}