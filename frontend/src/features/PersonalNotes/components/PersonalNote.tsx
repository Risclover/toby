import { useGetNoteQuery } from "@/store/noteSlice";
import { useAuthenticateQuery } from "@/store/authSlice";
import { NoteViewer } from "./NoteViewer";
import { Button } from "@mantine/core";
import { getLightColor } from "@/utils/getLightColor";
import { formatNoteDate } from "../utils/formatNoteDate";
import { ChevronDownIcon } from "@/assets/icons/ChevronDownIcon";
import { FaLock } from "react-icons/fa6";

type Props = {
    noteId: string;
    onBack: () => void;
}

export const PersonalNote = ({ noteId, onBack }: Props) => {
    const { data: currentUser } = useAuthenticateQuery();
    const { data: note } = useGetNoteQuery(noteId, { skip: !currentUser || !noteId });

    if (!note) return null;

    return (
        <div className="personal-note-container">
            <div className="personal-note-top-bar">
                <Button fw={500} p={0} variant="transparent" size="md" onClick={onBack}>
                    <ChevronDownIcon style={{ transform: "rotate(90deg)", marginRight: ".25rem" }} size="1rem" color="var(--mantine-color-blue-7)" />
                    Back
                </Button>
            </div>
            <div className="personal-note-header">
                <div className="personal-note-title">{note.title}</div>
                <div className="personal-note-form-subheader">
                    {note.category && (
                        <div
                            className="personal-note-category"
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