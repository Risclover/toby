import { useParams } from "react-router-dom";
import { useAuthenticateQuery, useGetCategoryQuery, useGetNoteQuery, useToggleNoteFavoriteMutation } from "@/store";
import { skipToken } from "@reduxjs/toolkit/query";

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
    const { data: category } = useGetCategoryQuery(note?.categoryId ?? skipToken, { skip: !note?.categoryId });

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async () => {
        await toggleNoteFavorite(noteId);
    }

    return {
        handleToggleFavorite,
        note,
        isError,
        isOwner,
        category
    }
}