import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { usePersonalNoteModal } from "@/contexts";
import { useIsSmallScreen } from "@/hooks";
import { useAuthenticateQuery } from "@/store";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEARCH_ANIMATION_DURATION = 0.22;
const SEARCH_ICON_SIZE = 38;
const SEARCH_PADDING_SIZE = 6.4;
const SEARCH_RIGHT_OFFSET = 32;

// ─── Types ────────────────────────────────────────────────────────────────────

type UsePersonalNotesToolbarProps = {
    /** Handler for changing search query */
    onSearchChange: (val: string) => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Handles logic for PersonalNotesToolbar component */
export const usePersonalNotesToolbar = ({ onSearchChange }: UsePersonalNotesToolbarProps) => {
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const { openModal } = usePersonalNoteModal();

    // ── State ─────────────────────────────────────────────────────────────────

    const [searchOpen, setSearchOpen] = useState(false);
    const isSmall = useIsSmallScreen(425);
    const userIsAuthor = !!currentUser && Number(userId) === currentUser.id;

    // ── Refs ──────────────────────────────────────────────────────────────────

    const inputRef = useRef<HTMLInputElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const toolbarWidthRef = useRef(200);

    // ── Animation ─────────────────────────────────────────────────────────────

    const progress = useMotionValue(0);

    const searchWidth = useTransform(progress, (p) => {
        const startWidth = SEARCH_ICON_SIZE + SEARCH_PADDING_SIZE;
        const fullWidth = toolbarWidthRef.current;
        return startWidth + (fullWidth - startWidth - SEARCH_RIGHT_OFFSET) * p;
    });

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleOpen = () => {
        if (toolbarRef.current) {
            toolbarWidthRef.current = toolbarRef.current.offsetWidth;
        }
        setSearchOpen(true);
        animate(progress, 1, { duration: SEARCH_ANIMATION_DURATION, ease: "easeInOut" });
    };

    const handleClose = () => {
        animate(progress, 0, {
            duration: SEARCH_ANIMATION_DURATION,
            ease: "easeInOut",
            onComplete: () => {
                setSearchOpen(false);
                onSearchChange("");
            },
        });
    };

    // ─────────────────────────────────────────────────────────────────────────

    return {
        userIsAuthor,
        isSmall,
        searchOpen,
        inputRef,
        searchWidth,
        toolbarRef,
        handleOpen,
        handleClose,
        openModal,
    };
};