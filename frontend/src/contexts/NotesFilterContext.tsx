import React, { createContext, useContext } from "react";
import { useNotesFilter } from "@/features/PersonalNotes";
import type { PersonalNote } from "@/store";

type NotesFilterContext = ReturnType<typeof useNotesFilter>;

type NotesFilterProviderProps = {
    notes: PersonalNote[] | undefined;
    isOwner: boolean;
    userId: number;
    children: React.ReactNode
}

const NotesFilterContext = createContext<NotesFilterContext | null>(null);

export const NotesFilterProvider = ({ notes, isOwner, userId, children }: NotesFilterProviderProps) => {
    const value = useNotesFilter(notes, isOwner, userId);
    return (
        <NotesFilterContext.Provider value={value}>
            {children}
        </NotesFilterContext.Provider>
    );
};

export const useNotesFilterContext = () => {
    const context = useContext(NotesFilterContext);
    if (!context) throw new Error("useNotesFilterContext must be used within NotesFilterProvider");
    return context;
};