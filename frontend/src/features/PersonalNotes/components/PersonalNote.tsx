import { useParams } from "react-router-dom";
import { ActionIcon, Button } from "@mantine/core";

import { NoteViewer } from "./NoteViewer";
import { formatNoteDate } from "../utils/formatNoteDate";
import { PersonalNoteCategoryPill } from "./PersonalNoteCategoryPill";
import { SingleNotePrivate } from "./SingleNotePrivate";
import { PersonalNoteMenu } from "./PersonalNoteMenu";
import { CreatePersonalNote } from "./CreatePersonalNote";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetNoteQuery, useToggleNoteFavoriteMutation } from "@/store/noteSlice";

import { FaHeart, FaLock, FaRegHeart } from "react-icons/fa6";
import { ChevronDownIcon } from "@/assets/icons/ChevronDownIcon";

type Props = {
    /** ID of the note to display */
    noteId: string;
    /** Called when the user wants to go back to the notes list */
    onBack: () => void;
    /** Called when the user clicks on the note's category pill */
    onCategoryClick: (categoryId: number) => void;
}

/** Single note page */
export const PersonalNote = ({ onCategoryClick, noteId, onBack }: Props) => {
    const [toggleNoteFavorite] = useToggleNoteFavoriteMutation();
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: note, isError } = useGetNoteQuery(noteId, { skip: !currentUser || !noteId });

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async () => {
        await toggleNoteFavorite(noteId);
    }

    if (isError) {
        return <SingleNotePrivate />;
    }

    if (!note) return null;

    return (
        <div className="personal-note-container">
            <div className="personal-note-top-bar">
                <Button color="rgb(5, 5, 73)" fw={500} p={0} variant="transparent" size="md" h="auto" onClick={onBack}>
                    <ChevronDownIcon style={{ transform: "rotate(90deg)", marginRight: ".25rem" }} size="1rem" color="rgb(5, 5, 73)" />
                    Back
                </Button>
                <div className="single-note-container-header--top-right">
                    {isOwner &&
                        <ActionIcon className="single-note-favorite-btn" onClick={handleToggleFavorite} size="md" color="red.5" variant="transparent">
                            {!note.isFavorite ? <FaRegHeart size="1.25rem" /> : <FaHeart size="1.25rem" />}
                        </ActionIcon>
                    }
                    {isOwner && <PersonalNoteMenu note={note} />}
                </div>
            </div>
            <div className="personal-note-header">
                <div className="personal-note-title">{note.title}</div>
                <div className="personal-note-form-subheader">
                    {note.category && <PersonalNoteCategoryPill onClick={(e) => {
                        e.stopPropagation();
                        onCategoryClick(note.category!.id);
                    }} category={note.category} />}
                    {note.isPrivate && (
                        <div className="personal-note-form-category">
                            <FaLock size=".75rem" color="var(--mantine-color-gray-7)" /> Private
                        </div>
                    )}
                    <div className="personal-note-date-container">
                        Posted <span className="personal-note-date">{formatNoteDate(note.createdAt)}</span>
                        {note.updatedAt !== note.createdAt && (
                            <>
                                <span className="date-dot">·</span> Last modified {formatNoteDate(note.updatedAt)}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="personal-note-content">
                <NoteViewer content={note.body} />
            </div>
            <CreatePersonalNote />
        </div>
    );
};