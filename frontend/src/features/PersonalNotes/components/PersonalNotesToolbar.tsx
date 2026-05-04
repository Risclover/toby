// PersonalNotesToolbar.tsx
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ActionIcon, Button } from "@mantine/core";

import { usePersonalNoteModal } from "@/contexts";
import { PersonalNotesOptionsDrawer } from "./PersonalNotesOptionsDrawer";
import { useIsSmallScreen } from "@/hooks";
import type { SortOption } from "../hooks";
import { useAuthenticateQuery, type NotesView } from "@/store";

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
    const { openModal } = usePersonalNoteModal();
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const userIsAuthor = !!currentUser && Number(userId) === currentUser.id;
    const isSmall = useIsSmallScreen(425);
    const [searchOpen, setSearchOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const toolbarWidthRef = useRef(200);

    const progress = useMotionValue(0);

    const searchWidth = useTransform(progress, (p) => {
        let paddingSize = 6.4;
        let iconSize = 38;

        const startWidth = iconSize + paddingSize;
        const full = toolbarWidthRef.current;

        return startWidth + (full - startWidth - 32) * p;
    });

    // Measure once after mount — reliable, no render-time read
    useEffect(() => {
        if (toolbarRef.current) {
            toolbarWidthRef.current = toolbarRef.current.offsetWidth;
        }
    }, []);

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    function handleOpen() {
        if (toolbarRef.current) {
            toolbarWidthRef.current = toolbarRef.current.offsetWidth;
        }
        setSearchOpen(true);
        animate(progress, 1, { duration: 0.22, ease: "easeInOut" });
    }

    function handleClose() {
        animate(progress, 0, { duration: 0.22, ease: "easeInOut" });
        setTimeout(() => {
            setSearchOpen(false);
            onSearchChange("");
        }, 220);
    }



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