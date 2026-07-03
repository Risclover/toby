import { useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { KittyNotification } from "@/components";
import { useAuthenticateQuery, useToggleNoteFavoriteMutation, type PersonalNote, useGetCategoryQuery } from "@/store";
import { parseNoteContent } from "../utils";
import { KittyIcons } from "@/assets";

type UsePersonalNoteItemProps = {
    /** The note being displayed */
    note: PersonalNote
}

/** Hook for logic from PersonalNoteGridItem and PersonalNoteListItem */
export const usePersonalNoteItem = ({ note }: UsePersonalNoteItemProps) => {
    const { userId } = useParams();
    const { text, images } = parseNoteContent(note.body);
    const [toggleNoteFavorite] = useToggleNoteFavoriteMutation();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: category } = useGetCategoryQuery(note?.categoryId ?? skipToken, { skip: !note?.categoryId });

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const data = await toggleNoteFavorite(note.id).unwrap();
        if (data?.isFavorite) {
            KittyNotification({
                title: "Note favorited successfully",
                message: <>Ooh la la, you've declared a special affinity for "<strong style={{ fontWeight: 500 }}>{note?.title}</strong>".</>,
                color: "green",
                icon: KittyIcons.Love
            })
        } else {
            KittyNotification({
                title: "Note unfavorited successfully",
                message: <>Hey, did you hear the latest gossip? The note "<strong style={{ fontWeight: 500 }}>{note?.title}</strong>" was unfavorited. Ouch!</>,
                color: "green",
                icon: KittyIcons.Cellphone
            })
        }
    }

    return {
        text,
        images,
        handleToggleFavorite,
        isOwner,
        category
    }
}