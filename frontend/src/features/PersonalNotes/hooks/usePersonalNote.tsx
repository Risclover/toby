import { useParams } from "react-router-dom";
import { useAuthenticateQuery, useGetCategoryQuery, useGetNoteQuery, useToggleNoteFavoriteMutation } from "@/store";
import { skipToken } from "@reduxjs/toolkit/query";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

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
        try {
            const data = await toggleNoteFavorite(noteId);
            if (data?.data?.isFavorite) {
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
                    icon: KittyIcons.Phonecall
                })
            }

        } catch (error) {
            console.error("Error favoriting note:", error);
            KittyNotification({
                title: "Nooo - it didn't work!",
                message: <>There was an error favoriting the note "<strong style={{ fontWeight: 500 }}>{note?.title}</strong>". You should give it another shot!</>,
                color: "red",
                icon: KittyIcons.Cry
            })
        }
    }

    return {
        handleToggleFavorite,
        note,
        isError,
        isOwner,
        category
    }
}