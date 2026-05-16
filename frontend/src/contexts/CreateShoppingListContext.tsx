import { createContext, useContext, useState, type ReactNode } from "react";

interface ShoppingListData {
    title?: string;

}

interface CreateShoppingListModalContextType {
    isOpen: boolean;
    ShoppingListData: ShoppingListData | null;
    openModal: (data?: ShoppingListData) => void;
    closeModal: () => void;
}

const CreateShoppingListModalContext = createContext<CreateShoppingListModalContextType | null>(null);

export const CreateShoppingListModalProvider = ({ children, }: { children: ReactNode; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [ShoppingListData, setShoppingListData] = useState<ShoppingListData | null>(null);

    const openModal = (data: ShoppingListData = {}) => {
        setShoppingListData(data);
        setIsOpen(true);
    };

    const closeModal = () => {
        setShoppingListData(null);
        setIsOpen(false);
    }

    return (
        <CreateShoppingListModalContext.Provider
            value={{ isOpen, ShoppingListData, openModal, closeModal }}
        >
            {children}
        </CreateShoppingListModalContext.Provider>
    )
}

export const useCreateShoppingListModal = (): CreateShoppingListModalContextType => {
    const context = useContext(CreateShoppingListModalContext);

    if (!context) {
        throw new Error("useCreateShoppingListModal must be used within a CreateShoppingListModalProvider")
    }

    return context;
}