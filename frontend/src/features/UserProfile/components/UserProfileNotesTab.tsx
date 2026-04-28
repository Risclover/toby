import { CreatePersonalNote } from "@/features/PersonalNotes/components/CreatePersonalNote";
import { PersonalNote } from "@/features/PersonalNotes/components/PersonalNote";
import { PersonalNotes } from "@/features/PersonalNotes/components/PersonalNotes";
import { NotesFilterProvider, useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { useGetUserNotesQuery } from "@/store/noteSlice";
import { Tabs } from "@mantine/core";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export const UserProfileNotesTab = () => {
    const { userId } = useParams();
    const { data: notes } = useGetUserNotesQuery(Number(userId));

    return (
        <NotesFilterProvider notes={notes}>
            <UserProfileNotesTabInner />
        </NotesFilterProvider>
    );
};

const UserProfileNotesTabInner = () => {
    const { noteId: noteIdFromUrl, userId } = useParams();
    const navigate = useNavigate();
    const [activeNoteId, setActiveNoteId] = useState<string | null>(noteIdFromUrl ?? null);
    const { updateFilters, filters } = useNotesFilterContext();

    const handleNoteClick = (id: string) => {
        setActiveNoteId(id);
        navigate(`/profile/${userId}/notes/${id}`);
    };

    const handleBack = () => {
        setActiveNoteId(null);
        navigate(`/profile/${userId}?tab=notes`);
    };

    const handleCategoryClick = (categoryId: number) => {
        updateFilters({ categoryIds: [categoryId] }); // set filter first
        setActiveNoteId(null);                         // then navigate
        navigate(`/profile/${userId}?tab=notes`);
    };

    console.log(filters.categoryIds)

    return (
        <Tabs.Panel value="notes" className="user-profile-main-container">
            {activeNoteId
                ? <PersonalNote onCategoryClick={handleCategoryClick} noteId={activeNoteId} onBack={handleBack} />
                : <PersonalNotes onNoteClick={handleNoteClick} />
            }
        </Tabs.Panel>
    );
};