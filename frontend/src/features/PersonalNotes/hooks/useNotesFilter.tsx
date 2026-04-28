import { useState, useMemo, useEffect, useCallback } from "react";
import type { PersonalNote } from "@/store";
import { parseNoteContent } from "../utils/parseNoteContent";

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

const PAGE_SIZE = 10;
const STORAGE_KEY = "notes-filter-state";
const DEFAULTS_KEY = "notes-filter-defaults";

const INITIAL_FILTERS: NotesFilterState = {
    favoritism: false,
    visibility: "all",
    categoryIds: [],
    sort: "newest",
};

const getInitialFilters = (): NotesFilterState => {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        // Fall back to saved defaults if no active session filters
        const defaults = localStorage.getItem(DEFAULTS_KEY);
        if (defaults) return { ...INITIAL_FILTERS, ...JSON.parse(defaults) };
    } catch { }
    return INITIAL_FILTERS;
};

export const useNotesFilter = (notes: PersonalNote[] | undefined) => {

    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState<NotesFilterState>(getInitialFilters);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Reset visible count whenever filters or search change
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, filters]);

    const updateFilters = (next: Partial<NotesFilterState>) => {
        setFilters(prev => {
            const updated = { ...prev, ...next };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const resetFilters = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setFilters(INITIAL_FILTERS);
        setSearchInput("");
        setDebouncedSearch("");
    };

    const isFiltered =
        filters.favoritism ||
        filters.visibility !== "all" ||
        filters.categoryIds.length > 0 ||
        debouncedSearch !== "";

    const filteredAndSorted = useMemo(() => {
        if (!notes) return [];

        const query = debouncedSearch.toLowerCase().trim();

        return [...notes]
            .filter(note => {
                if (filters.favoritism && !note.isFavorite) return false;
                if (filters.visibility === "public" && note.isPrivate) return false;
                if (filters.visibility === "private" && !note.isPrivate) return false;
                if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(note.categoryId ?? -1)) return false;
                if (query) {
                    const { text } = parseNoteContent(note.body);
                    const titleMatch = note.title.toLowerCase().includes(query);
                    const bodyMatch = text.toLowerCase().includes(query);
                    if (!titleMatch && !bodyMatch) return false;
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
                        if (a.isPrivate === b.isPrivate)
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        return a.isPrivate ? -1 : 1;
                    default:
                        return 0;
                }
            });
    }, [notes, debouncedSearch, filters]);

    const paginatedNotes = filteredAndSorted.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSorted.length;

    const loadMore = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredAndSorted.length));
    }, [filteredAndSorted.length]);

    const saveDefaults = (filters: NotesFilterState) => {
        localStorage.setItem(DEFAULTS_KEY, JSON.stringify({
            sort: filters.sort,
            // view is saved separately in localStorage already
        }));
    };

    return {
        searchInput,
        setSearchInput,
        filters,
        updateFilters,
        resetFilters,
        isFiltered,
        paginatedNotes,
        hasMore,
        loadMore,
        totalCount: filteredAndSorted.length,
        saveDefaults: () => saveDefaults(filters),
    };
};
