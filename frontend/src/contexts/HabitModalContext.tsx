import { createContext, useContext, useState, type ReactNode } from "react";

interface HabitData {
    id?: number;
    name?: string;
    description?: string | null;
    color?: string;
    isPrivate?: boolean;
}

interface HabitModalContextType {
    isOpen: boolean;
    habitData: HabitData | null;
    openModal: (data?: HabitData) => void;
    closeModal: () => void;
}

const HabitModalContext =
    createContext<HabitModalContextType | null>(null);

export const HabitModalProvider = ({ children, }: { children: ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [habitData, setHabitData] =
        useState<HabitData | null>(null);

    const openModal = (data: HabitData = {}) => {
        setHabitData(data);
        setIsOpen(true);
    };

    const closeModal = () => {
        setHabitData(null);
        setIsOpen(false);
    };

    return (
        <HabitModalContext.Provider
            value={{ isOpen, habitData, openModal, closeModal }}
        >
            {children}
        </HabitModalContext.Provider>
    );
};

export const useHabitModal = (): HabitModalContextType => {
    const context = useContext(HabitModalContext);

    if (!context) {
        throw new Error(
            "useHabitModal must be used within a HabitModalProvider"
        );
    }

    return context;
};
