import { useGetUserNotesQuery } from "@/store/noteSlice"
import { useNavigate, useParams } from "react-router-dom"
import { CreatePersonalNote } from "./CreatePersonalNote";
import { NoteViewer } from "./NoteViewer";
import { SimpleEditor } from "@/components/TipTap/tiptap-templates/simple/simple-editor";
import { Button } from "@mantine/core";
import { useState } from "react";
import "../styles/PersonalNotes.css"
import { useGetUserQuery } from "@/store";
import { SingleNote } from "./SingleNote";

export const PersonalNotes = ({ setShowNoteForm, onNoteClick }: { onNoteClick: (val: string) => void; setShowNoteForm: (val: boolean) => void }) => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const { data: user } = useGetUserQuery(Number(userId));
    const { data: notes } = useGetUserNotesQuery(Number(userId))

    return (
        <div className="personal-notes-container">
            <Button fw={500} size="sm" p=".5rem 1rem" h="auto" radius="sm" onClick={() => setShowNoteForm(true)}>Create note +</Button>
            <div className="personal-notes-grid">
                {notes?.map(note => <SingleNote onNoteClick={onNoteClick} note={note} />)}
            </div>
        </div>
    )
}