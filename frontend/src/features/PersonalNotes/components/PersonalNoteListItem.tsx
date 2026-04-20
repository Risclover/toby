import type { PersonalNote } from "@/store";
import { getLightColor } from "@/utils/getLightColor";
import { formatNoteDate } from "../utils/formatNoteDate";
import { parseNoteContent } from "../utils/parseNoteContent";
import { Text } from "@mantine/core";
import { FaLock } from "react-icons/fa6";

type Props = {
    note: PersonalNote;
    onNoteClick: (id: string) => void;
}

export const PersonalNoteListItem = ({ note, onNoteClick }: Props) => {
    const { text, images } = parseNoteContent(note.body);

    return (
        <div
            className="single-note-container list-container"
            onClick={() => onNoteClick(note.id)}
        >
            <div className="single-note-container-main list-container-main">
                <div className="single-note-container-top list-container-top">
                    {note.title && <div className="single-note-title list-note-title">{note.title}</div>}
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
                            {note.category && (
                                <div
                                    className="personal-note-category list-note-category"
                                    style={{
                                        background: getLightColor(note.category.color ?? "#000000"),
                                        color: note.category.color,
                                    }}
                                >
                                    {note.category.name}
                                </div>
                            )}
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