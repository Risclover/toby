import { createContext, useContext, useState, type ReactNode } from "react";

interface AnnouncementData {
    title?: string;
    body?: string;
}

interface CreateAnnouncementModalContextType {
    isOpen: boolean;
    announcementData: AnnouncementData | null;
    openModal: (data?: AnnouncementData) => void;
    closeModal: () => void;
}

const CreateAnnouncementModalContext =
    createContext<CreateAnnouncementModalContextType | null>(null);

export const CreateAnnouncementModalProvider = ({ children, }: { children: ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [announcementData, setAnnouncementData] =
        useState<AnnouncementData | null>(null);

    const openModal = (data: AnnouncementData = {}) => {
        setAnnouncementData(data);
        setIsOpen(true);
    };

    const closeModal = () => {
        setAnnouncementData(null);
        setIsOpen(false);
    };

    return (
        <CreateAnnouncementModalContext.Provider
            value={{ isOpen, announcementData, openModal, closeModal }}
        >
            {children}
        </CreateAnnouncementModalContext.Provider>
    );
};

export const useCreateAnnouncementModal = (): CreateAnnouncementModalContextType => {
    const context = useContext(CreateAnnouncementModalContext);

    if (!context) {
        throw new Error(
            "useCreateAnnouncementModal must be used within a CreateAnnouncementModalProvider"
        );
    }

    return context;
};
