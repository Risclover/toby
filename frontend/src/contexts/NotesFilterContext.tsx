import { createContext, useContext } from "react";
import { useNotesFilter } from "@/features/PersonalNotes/hooks/useNotesFilter";
import type { PersonalNote } from "@/store";

type NotesFilterContext = ReturnType<typeof useNotesFilter>;

const NotesFilterContext = createContext<NotesFilterContext | null>(null);

export const useNotesFilterContext = () => {
    const ctx = useContext(NotesFilterContext);
    if (!ctx) throw new Error("useNotesFilterContext must be used within NotesFilterProvider");
    return ctx;
};

export const NotesFilterProvider = ({ notes, isOwner, children }: { notes: PersonalNote[] | undefined, isOwner: boolean, children: React.ReactNode }) => {
    const value = useNotesFilter(notes, isOwner);
    return <NotesFilterContext.Provider value={value}>{children}</NotesFilterContext.Provider>;
};