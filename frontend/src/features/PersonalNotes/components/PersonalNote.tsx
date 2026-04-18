import { useGetNoteQuery, useGetUserNoteQuery, useUpdateNoteMutation } from "@/store/noteSlice";
import { useEffect } from "react";
import { useAuthenticateQuery } from "@/store/authSlice";
import { NoteViewer } from "./NoteViewer";
import { useForm } from "@mantine/form";
import { Button, Textarea } from "@mantine/core";
import { formatAnnouncementTimestamp } from "@/features/Announcements";
import { getReminderTime } from "@/features/Reminders/utils/getReminderTime";
import { useGetCategoriesQuery } from "@/store";
import { getLightColor } from "@/utils/getLightColor";

interface NoteFormValues {
    title: string;
}

interface Props {
    noteId: string;
    onBack: () => void;
}

export const PersonalNote = ({ noteId, onBack }: Props) => {
    const { data: currentUser } = useAuthenticateQuery();
    const { data: noteCategories } = useGetCategoriesQuery();
    const { data: note } = useGetNoteQuery(noteId, { skip: !currentUser || !noteId })

    console.log('NOTE 2:', noteCategories?.find(category => category.id === note?.categoryId))

    const [updateNote] = useUpdateNoteMutation();

    // Pass it to the helper


    const formatDate = (triggerDate?: string, createdAt?: string): string => {
        if (triggerDate) {
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (triggerDate === today) return "Today";
            if (triggerDate === yesterday) return "Yesterday";
            return new Date(triggerDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        }
        // fall back to relative time from createdAt
        const normalized = createdAt?.endsWith("Z") ? createdAt : createdAt + "Z";
        const diff = Math.floor((Date.now() - new Date(normalized!).getTime()) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(normalized!).toLocaleDateString();
    };

    if (!note) return null;

    return (
        <div
            className="personal-note-container"
        >
            <div className="personal-note-header">
                <div className="personal-note-title">{note.title}</div>
                <div className="personal-note-form-subheader">
                    {note.category && <div className="personal-note-category" style={{ background: getLightColor(note.category?.color || "#000000"), color: note.category?.color }}>{note.category?.name}</div>}
                    <div className="personal-note-date-container">Posted <span className="personal-note-date">{formatDate(undefined, note.createdAt)}</span> {note.updatedAt !== note.createdAt ? <><span className="date-dot">·</span> Last modified {formatDate(undefined, note.updatedAt)}</> : ""}</div></div>
            </div>
            <div className="personal-note-content"><NoteViewer content={note.body} /></div>
        </div >
    );
};