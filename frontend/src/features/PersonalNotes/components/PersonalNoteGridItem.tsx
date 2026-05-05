import { ActionIcon, Text } from "@mantine/core";

import { PersonalNoteCategoryPill } from "./PersonalNoteCategoryPill";
import { PersonalNoteMenu } from "./PersonalNoteMenu";
import { type PersonalNote } from "@/store";
import { getLightColor } from "@/utils/getLightColor";
import { formatNoteDate } from "../utils/formatNoteDate";

import { FaHeart, FaLock, FaRegHeart } from "react-icons/fa6";
import { usePersonalNoteItem } from "../hooks/usePersonalNoteItem";

type Props = {
    /** The note to display */
    note: PersonalNote;
    /** Called when the user clicks on the note */
    onNoteClick: (id: string) => void;
}

/** Single note item in the notes grid */
export const PersonalNoteGridItem = ({ note, onNoteClick }: Props) => {
    const {
        handleToggleFavorite,
        images,
        text,
        isOwner
    } = usePersonalNoteItem({ note });
    return (
        <div
            className="single-note-container"
            style={{ borderTop: `6px solid ${note.category ? getLightColor(note.category.color ?? "#000000", 1) : "transparent"}` }}
            onClick={() => onNoteClick(note.id)}
        >
            <div className="single-note-container-main">
                <div className="single-note-container-header">
                    <div className="single-note-container-header--top">
                        {note.title && <div className="single-note-title">{note.title}</div>}
                        <div className="single-note-container-header--top-right">
                            {isOwner &&
                                <ActionIcon className="single-note-favorite-btn" onClick={handleToggleFavorite} size="md" color="red.5" variant="transparent">
                                    {!note.isFavorite ? <FaRegHeart size="1.25rem" /> : <FaHeart size="1.25rem" />}
                                </ActionIcon>
                            }
                            {isOwner && <PersonalNoteMenu note={note} />}
                        </div>
                    </div>
                    <div className="single-note-date-container">
                        Posted <span className="personal-note-date">{formatNoteDate(note.createdAt)}</span>
                        {note.updatedAt !== note.createdAt && (
                            <> <span className="date-dot">·</span> Last modified {formatNoteDate(note.updatedAt)}</>
                        )}
                    </div>
                </div>
                <div className="single-note-content">
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
                <div className="single-note-footer">
                    <div className="single-note-footer-left">
                        <div className="single-note-subheader">
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