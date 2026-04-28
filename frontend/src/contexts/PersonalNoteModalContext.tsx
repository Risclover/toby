import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface PersonalNoteData {
    id?: string;
    title?: string;
    body?: string;
    categoryId?: number;
    isPrivate?: boolean;
    isFavorite?: boolean;
}

interface PersonalNoteModalContextType {
    isOpen: boolean;
    personalNoteData: PersonalNoteData | null;
    openModal: (data?: PersonalNoteData) => void;
    closeModal: () => void;
}

const PersonalNoteModalContext =
    createContext<PersonalNoteModalContextType | null>(null);

export const PersonalNoteModalProvider = ({ children, }: { children: ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [personalNoteData, setPersonalNoteData] =
        useState<PersonalNoteData | null>(null);


    const openModal = (data: PersonalNoteData = {}) => {
        setPersonalNoteData(data);
        setIsOpen(true);
    };

    const closeModal = () => {
        setPersonalNoteData(null);
        setIsOpen(false);
    };


    return (
        <PersonalNoteModalContext.Provider
            value={{ isOpen, personalNoteData, openModal, closeModal }}
        >
            {children}
        </PersonalNoteModalContext.Provider>
    );
};

export const usePersonalNoteModal = (): PersonalNoteModalContextType => {
    const context = useContext(PersonalNoteModalContext);

    if (!context) {
        throw new Error(
            "usePersonalNoteModal must be used within a PersonalNoteModalProvider"
        );
    }

    return context;
};
