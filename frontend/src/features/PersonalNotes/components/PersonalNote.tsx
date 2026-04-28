import { useGetNoteQuery, useToggleNoteFavoriteMutation } from "@/store/noteSlice";
import { useAuthenticateQuery } from "@/store/authSlice";
import { NoteViewer } from "./NoteViewer";
import { ActionIcon, Button } from "@mantine/core";
import { getLightColor } from "@/utils/getLightColor";
import { formatNoteDate } from "../utils/formatNoteDate";
import { ChevronDownIcon } from "@/assets/icons/ChevronDownIcon";
import { FaHeart, FaLock, FaRegHeart } from "react-icons/fa6";
import { PersonalNoteCategoryPill } from "./PersonalNoteCategoryPill";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { useParams } from "react-router-dom";

type Props = {
    noteId: string;
    onBack: () => void;
    onCategoryClick: (categoryId: number) => void;
}

export const PersonalNote = ({ onCategoryClick, noteId, onBack }: Props) => {
    const { filters, updateFilters } = useNotesFilterContext();
    const [toggleNoteFavorite] = useToggleNoteFavoriteMutation();
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: note } = useGetNoteQuery(noteId, { skip: !currentUser || !noteId });

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async () => {
        await toggleNoteFavorite(noteId);
    }

    if (!note) return null;

    return (
        <div className="personal-note-container">
            <div className="personal-note-top-bar">
                <Button color="rgb(5, 5, 73)" fw={500} p={0} variant="transparent" size="md" h="auto" onClick={onBack}>
                    <ChevronDownIcon style={{ transform: "rotate(90deg)", marginRight: ".25rem" }} size="1rem" color="rgb(5, 5, 73)" />
                    Back
                </Button>
                {isOwner && <ActionIcon className="single-note-favorite-btn" onClick={handleToggleFavorite} size="md" color="rgb(5, 5, 73)" variant="transparent">
                    {!note.isFavorite ? <FaRegHeart size="1.25rem" /> : <FaHeart size="1.25rem" />}
                </ActionIcon>}
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
                            <> <span className="date-dot">·</span> Last modified {formatNoteDate(note.updatedAt)}</>
                        )}
                    </div>
                </div>
            </div>
            <div className="personal-note-content">
                <NoteViewer content={note.body} />
            </div>
        </div>
    );
};