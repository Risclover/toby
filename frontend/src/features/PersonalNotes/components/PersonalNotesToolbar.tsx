import { motion } from "framer-motion";
import { ActionIcon, Button } from "@mantine/core";

import { PersonalNotesOptionsDrawer } from "./PersonalNotesOptionsDrawer";
import { usePersonalNotesToolbar, type SortOption } from "../hooks";
import { type NotesView } from "@/store";

import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

type Props = {
    /** Current search query */
    search: string;
    /** Handler for updating the search query */
    onSearchChange: (val: string) => void;
    /** Whether any filters are currently applied */
    isFiltered: boolean;
    /** Current notes view (grid or list) */
    view: NotesView;
    /** Handler for changing the notes view */
    onViewChange: (next: NotesView) => void;
    /** Current sort option */
    sort: SortOption;
    /** Handler for changing the sort option */
    onSortChange: (val: SortOption) => void;
};

/** Toolbar component for the personal notes page, containing the search input, sort/filter/view options, and create note button */
export const PersonalNotesToolbar = ({
    search,
    onSearchChange,
    view,
    onViewChange,
    sort,
    onSortChange,
}: Props) => {
    const {
        userIsAuthor,
        isSmall,
        searchOpen,
        inputRef,
        searchWidth,
        toolbarRef,
        handleOpen,
        handleClose,
        openModal
    } = usePersonalNotesToolbar({ onSearchChange })

    return (
        <div className="personal-notes-toolbar" ref={toolbarRef}>
            <motion.div
                className={`personal-notes-search-container${searchOpen ? " personal-notes-search-container--expanded" : ""}`}
                style={{ width: searchWidth }}
            >
                <ActionIcon
                    className="personal-notes-search-icon"
                    color="rgb(5,5,73)"
                    variant={searchOpen ? "transparent" : "subtle"}
                    onClick={() => !searchOpen && handleOpen()}
                    aria-label="Search notes"
                >
                    <FaMagnifyingGlass size="1rem" />
                </ActionIcon>
                {searchOpen && (
                    <input
                        ref={inputRef}
                        className="personal-notes-search-input"
                        placeholder="Search notes..."
                        value={search}
                        onChange={(e) => onSearchChange(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === "Escape" && handleClose()}
                        aria-label="Search notes"
                    />
                )}
                {searchOpen && (
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={handleClose}
                        aria-label="Close search"
                    >
                        <FaXmark size=".75rem" />
                    </ActionIcon>
                )}
            </motion.div>
            <div className="personal-notes-toolbar--right">
                <PersonalNotesOptionsDrawer
                    sort={sort}
                    onSortChange={onSortChange}
                    view={view}
                    onViewChange={onViewChange}
                />
                {userIsAuthor &&
                    <Button
                        color="rgb(5, 5, 73)"
                        size={isSmall ? "13px" : "sm"}
                        h="auto"
                        p=".5rem 1rem"
                        fw={500}
                        onClick={() => openModal()}
                    >
                        Create note
                    </Button>}
            </div>

        </div >
    );
};