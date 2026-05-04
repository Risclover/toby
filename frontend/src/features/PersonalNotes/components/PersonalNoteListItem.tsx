import { useParams } from "react-router-dom";
import { ActionIcon, Text } from "@mantine/core";

import { useAuthenticateQuery, useToggleNoteFavoriteMutation, type PersonalNote } from "@/store";
import { formatNoteDate } from "../utils/formatNoteDate";
import { parseNoteContent } from "../utils/parseNoteContent";
import { PersonalNoteCategoryPill } from "./PersonalNoteCategoryPill";
import { PersonalNoteMenu } from "./PersonalNoteMenu";

import { FaHeart, FaLock, FaRegHeart } from "react-icons/fa6";

type Props = {
    /** The note to display */
    note: PersonalNote;
    /** Called when the user clicks on the note */
    onNoteClick: (id: string) => void;
}

/** Single note item in the notes list view */
export const PersonalNoteListItem = ({ note, onNoteClick }: Props) => {
    const { text, images } = parseNoteContent(note.body);
    const [toggleNoteFavorite] = useToggleNoteFavoriteMutation();
    const { data: currentUser } = useAuthenticateQuery();
    const { userId } = useParams();

    const isOwner = currentUser?.id === Number(userId);

    const handleToggleFavorite = async (e: MouseEvent) => {
        e.stopPropagation();
        await toggleNoteFavorite(note.id).unwrap();
    }
    return (
        <div
            className="single-note-container list-container"
            onClick={() => onNoteClick(note.id)}
        >
            <div className="single-note-container-main list-container-main">
                <div className="single-note-container-header list-container-top">
                    <div className="single-note-container-header--top">
                        {note.title && <div className="single-note-title list-note-title">{note.title}</div>}
                        <div className="single-note-container-header--top-right">
                            {isOwner &&
                                <ActionIcon className="single-note-favorite-btn" onClick={handleToggleFavorite} size="md" color="red.5" variant="transparent">
                                    {!note.isFavorite ? <FaRegHeart size="1.25rem" /> : <FaHeart size="1.25rem" />}
                                </ActionIcon>
                            }
                            {isOwner && <PersonalNoteMenu note={note} />}
                        </div>
                    </div>
                    <div className="single-note-date-container list-date-container">
                        Posted <span className="personal-note-date list-note-date">{formatNoteDate(note.createdAt)}</span>
                        {note.updatedAt !== note.createdAt && (
                            <> <span className="date-dot">·</span> Last modified {formatNoteDate(note.updatedAt)}</>
                        )}
                    </div>
                </div>
                <div className="single-note-content list-note-content">
                    <Text size="sm" lineClamp={3} c="black">{text}</Text>
                    {images.length > 0 && (
                        <div className="single-note-images">
                            {images.slice(0, 3).map((src, i) => (
                                <img key={i} src={src} className="single-note-image-thumb" alt="" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {(note.categoryId !== null || note.isPrivate) && (
                <div className="single-note-footer list-note-footer">
                    <div className="single-note-footer-left list-note-footer-left">
                        <div className="single-note-subheader list-note-subheader">
                            {note.category && <PersonalNoteCategoryPill category={note.category} />}
                            {note.isPrivate && (
                                <div className="personal-note-form-category">
                                    <FaLock size=".75rem" color="var(--mantine-color-gray-7)" /> Private
                                </div>
                            )}
                        </div>
                    </div>
                    <Text
                        size="sm"
                        styles={{ root: { color: note.category?.color } }}
                        className="single-note-footer-right"
                    >
                        Open
                    </Text>
                </div>
            )}
        </div>
    );
};