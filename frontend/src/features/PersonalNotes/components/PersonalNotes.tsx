import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetUserNotesQuery } from "@/store/noteSlice";
import { Button } from "@mantine/core";
import { CreatePersonalNote } from "./CreatePersonalNote";
import { PersonalNoteGridItem } from "./PersonalNoteGridItem";
import { PersonalNotesOptions, type NotesView } from "./PersonalNotesOptions";
import "../styles/PersonalNotes.css";
import { PersonalNoteListItem } from "./PersonalNoteListItem";

type Props = {
    onNoteClick: (id: string) => void;
}


export const PersonalNotes = ({ onNoteClick }: Props) => {
    const { userId } = useParams();
    const { data: notes } = useGetUserNotesQuery(Number(userId));
    const [view, setView] = useState<NotesView>(() => {
        const saved = localStorage.getItem("notes-view");
        return saved !== null ? JSON.parse(saved) : "board";
    });
    const [showNoteForm, setShowNoteForm] = useState(false);

    useEffect(() => {
        localStorage.setItem("notes-view", JSON.stringify(view));
    }, [view])

    return (
        <div className="personal-notes-container">
            <PersonalNotesOptions
                view={view}
                onViewChange={setView}
                onCreateNote={() => setShowNoteForm(true)}
            />
            <Button
                fw={500}
                size="sm"
                p=".5rem 1rem"
                h="auto"
                radius="sm"
                onClick={() => setShowNoteForm(true)}
            >
                Create note +
            </Button>
            {view === "board" && (
                <div className="personal-notes-grid">
                    {notes?.map(note => (
                        <PersonalNoteGridItem key={note.id} note={note} onNoteClick={onNoteClick} />
                    ))}
                </div>
            )}
            {view === "list" && (
                <div className="personal-notes-list">
                    {notes?.map(note => (
                        <PersonalNoteListItem key={note.id} note={note} onNoteClick={onNoteClick} />
                    ))}
                </div>
            )}
            <CreatePersonalNote showNoteForm={showNoteForm} setShowNoteForm={setShowNoteForm} />
        </div>
    );
};