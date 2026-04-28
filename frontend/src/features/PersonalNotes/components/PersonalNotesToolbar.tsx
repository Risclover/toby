// PersonalNotesToolbar.tsx
import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, Indicator } from "@mantine/core";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { PersonalNotesViewOptions, type NotesView } from "./PersonalNotesViewOptions";
import { animate, motion, progress, useMotionValue, useTransform } from "framer-motion";
import { IoOptions } from "react-icons/io5";
import { useIsSmallScreen } from "@/hooks";
import { PersonalNotesOptionsDrawer } from "./PersonalNotesOptionsDrawer/PersonalNotesOptionsDrawer";
import type { SortOption } from "../hooks/useNotesFilter";
import { useParams } from "react-router-dom";
import { useAuthenticateQuery } from "@/store";

type Props = {
    search: string;
    onSearchChange: (val: string) => void;
    isFiltered: boolean;
    onFilterClick: () => void;
    onOptionsClick: () => void;
    view: NotesView;
    onViewChange: (next: NotesView) => void;
    sort: SortOption;
    onSortChange: (val: SortOption) => void;
    setShowNoteForm: (val: boolean) => void;
};

export const PersonalNotesToolbar = ({
    search,
    onSearchChange,
    isFiltered,
    onFilterClick,
    onOptionsClick,
    view,
    onViewChange,
    sort,
    onSortChange,
    setShowNoteForm
}: Props) => {
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
        const full = toolbarWidthRef.current;
        let paddingSize = 6.4;
        let iconSize = 38;
        const startWidth = iconSize + paddingSize; // 36px icon + 0.4rem padding (0.4 * 16)
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
                {/* Controls sit on the left naturally, get pushed off as search expands */}
                <PersonalNotesOptionsDrawer
                    isFiltered={isFiltered}
                    sort={sort}
                    onSortChange={onSortChange}
                    view={view}
                    onViewChange={onViewChange}
                />
                {userIsAuthor && <Button color="rgb(5, 5, 73)" size={isSmall ? "13px" : "sm"} h="auto" p=".5rem 1rem" fw={500} onClick={() => setShowNoteForm(true)}>
                    Create note
                </Button>}
                {/* Search sits on the right, expands leftward pushing controls off */}
            </div>

        </div >
    );
};