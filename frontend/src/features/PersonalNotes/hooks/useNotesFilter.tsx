import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGetUserNoteCategoriesQuery, type NotesView, type PersonalNote } from "@/store";
import { parseNoteContent } from "../utils/parseNoteContent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FavoriteFilter = boolean;
export type VisibilityFilter = "all" | "public" | "private";
export type SortOption = "newest" | "oldest" | "alpha" | "category_alpha" | "private_first";
export type ViewOption = "grid" | "list";

export interface NotesFilterState {
    favoritism: FavoriteFilter;
    visibility: VisibilityFilter;
    categoryIds: number[];
    sort: SortOption;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const SESSION_KEY = (userId: number) => `notes-filter-state-${userId}`;
const DEFAULTS_KEY = "notes-filter-defaults";
const VIEW_KEY = "notes-view";

const INITIAL_FILTERS: NotesFilterState = {
    favoritism: false,
    visibility: "all",
    categoryIds: [],
    sort: "newest",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Helper for loading filter state from session or local storage */
function loadFilterState(userId: number): NotesFilterState {
    try {
        const session = sessionStorage.getItem(SESSION_KEY(userId));
        if (session) return JSON.parse(session);
        const defaults = localStorage.getItem(DEFAULTS_KEY);
        if (defaults) return { ...INITIAL_FILTERS, ...JSON.parse(defaults) };
    } catch { }
    return INITIAL_FILTERS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Manages filtering, sorting, searching, and pagination of personal notes. */
export const useNotesFilter = (notes: PersonalNote[] | undefined, isOwner: boolean, userId: number) => {
    const { data: categories } = useGetUserNoteCategoriesQuery(userId);

    // ── State ─────────────────────────────────────────────────────────────────

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState<NotesFilterState>(() => loadFilterState(userId));
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [view, setView] = useState<NotesView>(() => {
        const saved = localStorage.getItem(VIEW_KEY);
        return saved !== null ? JSON.parse(saved) : "grid";
    });

    const sentinelRef = useRef<HTMLDivElement>(null);

    // ── Derived values ────────────────────────────────────────────────────────

    const filteredAndSorted = useMemo(() => {
        if (!notes) return [];
        const query = debouncedSearch.toLowerCase().trim();

        return [...notes]
            .filter(note => {
                if (!isOwner && note.isPrivate) return false;
                if (filters.favoritism && !note.isFavorite) return false;
                if (filters.visibility === "public" && note.isPrivate) return false;
                if (filters.visibility === "private" && !note.isPrivate) return false;
                if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(note.categoryId ?? -1)) return false;
                if (query) {
                    const { text } = parseNoteContent(note.body);
                    if (!note.title.toLowerCase().includes(query) && !text.toLowerCase().includes(query)) return false;
                }
                return true;
            })
            .sort((a, b) => {
                switch (filters.sort) {
                    case "newest":
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    case "oldest":
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    case "alpha":
                        return a.title.localeCompare(b.title);
                    case "category_alpha": {
                        const aCat = a.category?.name ?? "\uffff";
                        const bCat = b.category?.name ?? "\uffff";
                        return aCat.localeCompare(bCat) || a.title.localeCompare(b.title);
                    }
                    case "private_first":
                        if (a.isPrivate !== b.isPrivate) return a.isPrivate ? -1 : 1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    default:
                        return 0;
                }
            });
    }, [notes, debouncedSearch, filters, isOwner]);

    const paginatedNotes = filteredAndSorted.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSorted.length;

    const isFiltered =
        filters.favoritism ||
        filters.visibility !== "all" ||
        filters.categoryIds.length > 0 ||
        debouncedSearch !== "";

    // ── Handlers ──────────────────────────────────────────────────────────────

    const updateFilters = useCallback((next: Partial<NotesFilterState>) => {
        setFilters(prev => {
            const updated = { ...prev, ...next };
            sessionStorage.setItem(SESSION_KEY(userId), JSON.stringify(updated));
            return updated;
        });
    }, [userId]);

    const resetFilters = useCallback(() => {
        sessionStorage.removeItem(SESSION_KEY(userId));
        setFilters(INITIAL_FILTERS);
        setSearchInput("");
        setDebouncedSearch("");
    }, [userId]);

    const saveDefaults = useCallback(() => {
        localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ sort: filters.sort }));
    }, [filters.sort]);

    const handleViewChange = useCallback((next: ViewOption) => {
        setView(next);
        localStorage.setItem(VIEW_KEY, JSON.stringify(next));
    }, []);

    const loadMore = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredAndSorted.length));
    }, [filteredAndSorted.length]);

    // ── Effects ───────────────────────────────────────────────────────────────

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset pagination when filters or search change
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, filters]);

    // Re-initialize state when navigating to a different user's notes page
    useEffect(() => {
        setFilters(loadFilterState(userId));
        setSearchInput("");
        setDebouncedSearch("");
    }, [userId]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && hasMore) loadMore(); },
            { threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    // ─────────────────────────────────────────────────────────────────────────

    return {
        searchInput,
        setSearchInput,
        filters,
        updateFilters,
        resetFilters,
        isFiltered,
        paginatedNotes,
        totalCount: filteredAndSorted.length,
        saveDefaults,
        view,
        handleViewChange,
        isEmpty: paginatedNotes.length === 0,
        sentinelRef,
        categories,
        loadMore,
        hasMore
    };
};