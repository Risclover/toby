import { CreatePersonalNote } from "@/features/PersonalNotes/components/CreatePersonalNote";
import { PersonalNote } from "@/features/PersonalNotes/components/PersonalNote";
import { PersonalNotes } from "@/features/PersonalNotes/components/PersonalNotes";
import { NotesFilterProvider, useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { useGetUserNotesQuery } from "@/store/noteSlice";
import { Tabs } from "@mantine/core";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUserSettingsQuery } from "@/store/userSettingsSlice";
import { useAuthenticateQuery } from "@/store";
import { NotesPrivate } from "@/features/PersonalNotes/components/NotesPrivate";
import { NotesEmpty } from "@/features/PersonalNotes/components/NotesEmpty";

export const UserProfileNotesTab = () => {
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: notes } = useGetUserNotesQuery(Number(userId));

    return (
        <NotesFilterProvider notes={notes} isOwner={currentUser?.id === Number(userId)} userId={Number(userId)}>
            <UserProfileNotesTabInner />
        </NotesFilterProvider>
    );
};

const UserProfileNotesTabInner = () => {
    const { noteId: noteIdFromUrl, userId } = useParams();
    const navigate = useNavigate();
    const [activeNoteId, setActiveNoteId] = useState<string | null>(noteIdFromUrl ?? null);
    const { updateFilters, filters } = useNotesFilterContext();
    const { data: userSettings } = useGetUserSettingsQuery(Number(userId));
    const { data: user } = useAuthenticateQuery();
    const { data: notes, isFetching } = useGetUserNotesQuery(Number(userId));

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

    const myProfilePage = user?.id === Number(userId);

    return (
        <Tabs.Panel value="notes" className="user-profile-main-container">
            {userSettings?.settings.notesPrivacyMode === "all_private" && !myProfilePage
                ? <NotesPrivate />
                : myProfilePage && notes?.length === 0 && !isFetching
                    ? <NotesEmpty />
                    : activeNoteId
                        ? <PersonalNote onCategoryClick={handleCategoryClick} noteId={activeNoteId} onBack={handleBack} />
                        : <PersonalNotes onNoteClick={handleNoteClick} />
            }
            <CreatePersonalNote />
        </Tabs.Panel>
    );
};