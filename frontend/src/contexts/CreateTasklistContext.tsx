import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

type CreateTasklistState = {
    isOpen: boolean;
    initialTitle?: string;
};

type CreateTasklistContextType = {
    state: CreateTasklistState;
    openCreateTasklist: (options?: { initialTitle?: string }) => void;
    closeCreateTasklist: () => void;
};

const CreateTasklistContext = createContext<CreateTasklistContextType | undefined>(
    undefined
);

type CreateTasklistProviderProps = {
    children: ReactNode;
};

export function CreateTasklistProvider({ children }: CreateTasklistProviderProps) {
    const [state, setState] = useState<CreateTasklistState>({ isOpen: false });

    function openCreateTasklist(options?: { initialTitle?: string }) {
        setState({ isOpen: true, initialTitle: options?.initialTitle });
    }

    function closeCreateTasklist() {
        setState({ isOpen: false, initialTitle: undefined });
    }

    return (
        <CreateTasklistContext.Provider
            value={{ state, openCreateTasklist, closeCreateTasklist }}
        >
            {children}
        </CreateTasklistContext.Provider>
    );
}

export function useCreateTasklist() {
    const ctx = useContext(CreateTasklistContext);
    if (!ctx) {
        throw new Error("useCreateTasklist must be used within CreateTasklistProvider");
    }
    return ctx;
}
