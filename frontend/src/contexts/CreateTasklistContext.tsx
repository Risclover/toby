import { createContext, useContext, useState, type ReactNode } from "react";

interface TasklistData {
    title?: string;
    body?: string;
}

interface CreateTasklistModalContextType {
    isOpen: boolean;
    TasklistData: TasklistData | null;
    openModal: (data?: TasklistData) => void;
    closeModal: () => void;
}

const CreateTasklistModalContext =
    createContext<CreateTasklistModalContextType | null>(null);

export const CreateTasklistModalProvider = ({ children, }: { children: ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [TasklistData, setTasklistData] =
        useState<TasklistData | null>(null);

    const openModal = (data: TasklistData = {}) => {
        setTasklistData(data);
        setIsOpen(true);
    };

    const closeModal = () => {
        setTasklistData(null);
        setIsOpen(false);
    };

    return (
        <CreateTasklistModalContext.Provider
            value={{ isOpen, TasklistData, openModal, closeModal }}
        >
            {children}
        </CreateTasklistModalContext.Provider>
    );
};

export const useCreateTasklistModal = (): CreateTasklistModalContextType => {
    const context = useContext(CreateTasklistModalContext);

    if (!context) {
        throw new Error(
            "useCreateTasklistModal must be used within a CreateTasklistModalProvider"
        );
    }

    return context;
};
