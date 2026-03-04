import { createContext, useContext, useState, type ReactNode } from "react";


interface ReminderData {
    message?: string;
}

interface CreateReminderModalContextType {
    isOpen: boolean;
    reminderData: ReminderData | null;
    openCreateReminderModal: (data?: ReminderData) => void;
    closeCreateReminderModal: () => void;
}

const CreateReminderModalContext = createContext<CreateReminderModalContextType | null>(null);

export const CreateReminderModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [reminderData, setReminderData] = useState<ReminderData | null>(null);

    const openCreateReminderModal = (data: ReminderData = {}) => {
        setReminderData(data);
        setIsOpen(true);
    }

    const closeCreateReminderModal = () => {
        setReminderData(null);
        setIsOpen(false);
    }

    return (
        <CreateReminderModalContext.Provider value={{ isOpen, reminderData, openCreateReminderModal, closeCreateReminderModal }}>
            {children}
        </CreateReminderModalContext.Provider>
    )
};

export const useCreateReminderModal = (): CreateReminderModalContextType => {
    const context = useContext(CreateReminderModalContext);

    if (!context) {
        throw new Error("useCreateReminderModal must be used within a CreateReminderModalProvider")
    };

    return context;
}