import { CreatePersonalNote } from "@/features/PersonalNotes/components/CreatePersonalNote";
import { PersonalNote } from "@/features/PersonalNotes/components/PersonalNote";
import { PersonalNotes } from "@/features/PersonalNotes/components/PersonalNotes"
import { Tabs } from "@mantine/core"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom";

type Props = {
    showSingleNote?: boolean;
}

export const UserProfileNotesTab = () => {
    const { noteId: noteIdFromUrl, userId } = useParams();
    const navigate = useNavigate();
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(noteIdFromUrl ?? null);

    const handleNoteClick = (id: string) => {
        setActiveNoteId(id);
        navigate(`/profile/${userId}/notes/${id}`); // Update URL without full navigation
    };

    const handleBack = () => {
        setActiveNoteId(null);
        navigate(`/profile/${userId}?tab=notes`);
    };

    return (
        <Tabs.Panel value="notes" className="user-profile-main-container">
            {activeNoteId ? (
                <PersonalNote noteId={activeNoteId} onBack={handleBack} />
            ) : showNoteForm ? (
                <CreatePersonalNote
                    setShowNoteForm={setShowNoteForm}
                    onNoteCreated={(id) => handleNoteClick(id)}
                />
            ) : (
                <PersonalNotes
                    setShowNoteForm={setShowNoteForm}
                    onNoteClick={handleNoteClick}
                />
            )}
        </Tabs.Panel>
    );
};