import { useState, useEffect, useRef } from "react";
import {
    ActionIcon,
    Button,
    Text,
} from "@mantine/core";
import { CreatePersonalNote } from "./CreatePersonalNote";
import { PersonalNoteGridItem } from "./PersonalNoteGridItem";
import { PersonalNoteListItem } from "./PersonalNoteListItem";
import { type NotesView } from "./PersonalNotesViewOptions";
import { PersonalNotesFilterDrawer } from "./PersonalNotesFilterDrawer";
import { PersonalNotesToolbar } from "./PersonalNotesToolbar";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import "../styles/PersonalNotes.css";
import { useAuthenticateQuery, useGetCategoriesQuery, type PersonalNote } from "@/store";
import { PersonalNoteCategoryPill } from "./PersonalNoteCategoryPill";
import { FaXmark } from "react-icons/fa6";
import { AnimatePresence, motion } from "framer-motion";
import type { ViewOption } from "../hooks/useNotesFilter";
import { useParams } from "react-router-dom";

type Props = {
    onNoteClick: (id: string) => void;
};

export const PersonalNotes = ({ onNoteClick }: Props) => {
    const { data: categories } = useGetCategoriesQuery();
    const {
        searchInput,
        setSearchInput,
        filters,
        updateFilters,
        resetFilters,
        isFiltered,
        paginatedNotes,
        hasMore,
        loadMore,
        totalCount,
    } = useNotesFilterContext();
    const isFirstRender = useRef(true);

    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    console.log('FILTERS:', filters.categoryIds);

    const [view, setView] = useState<NotesView>(() => {
        const saved = localStorage.getItem("notes-view");
        return saved !== null ? JSON.parse(saved) : "grid";
    });
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && hasMore) loadMore(); },
            { threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);

    const handleViewChange = (next: ViewOption) => {
        setView(next);
        localStorage.setItem("notes-view", JSON.stringify(next));
    };

    const isEmpty = paginatedNotes.length === 0;


    return (
        <div className="personal-notes-container">
            <div className="notes-controls-bar">
                <PersonalNotesToolbar
                    search={searchInput}
                    onSearchChange={setSearchInput}
                    isFiltered={isFiltered}
                    onFilterClick={() => setShowFilterDrawer(true)}
                    onOptionsClick={() => { }}
                    view={view}
                    onViewChange={handleViewChange}
                    sort={filters.sort}
                    onSortChange={(val) => updateFilters({ sort: val })}
                    setShowNoteForm={setShowNoteForm}
                />
            </div>
            {filters.categoryIds.length > 0 && (
                <div className="notes-category-banner">
                    <div className="notes-category-banner-pills">
                        <AnimatePresence mode="popLayout">
                            {filters.categoryIds
                                .map(id => categories?.find(c => c.id === id))
                                .filter(Boolean)
                                .map(category => (
                                    <motion.div
                                        key={category!.id}
                                        layout
                                        initial={isFirstRender.current ? false : { opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                    >
                                        <PersonalNoteCategoryPill
                                            category={category!}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateFilters({ categoryIds: filters.categoryIds.filter(id => id !== category!.id) });
                                            }}
                                        />
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </div>
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => updateFilters({ categoryIds: [] })}
                        aria-label="Clear category filter"
                        style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                    >
                        <FaXmark size=".75rem" />
                    </ActionIcon>
                </div>
            )}
            {isFiltered && (
                <div className="personal-notes-results-count">
                    <Text size="xs" c="dimmed" px="xs" mt={4}>
                        {totalCount} result{totalCount !== 1 ? "s" : ""}
                    </Text>
                </div>
            )}

            {isEmpty ? (
                <div className="notes-empty-state">
                    <Text c="dimmed" size="sm">
                        {isFiltered ? "No notes match your search or filters." : "No notes yet."}
                    </Text>
                    {isFiltered && (
                        <Button variant="subtle" size="xs" mt="xs" onClick={resetFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {view === "grid" && (
                        <div className="personal-notes-grid">
                            {paginatedNotes.map(note => (
                                <PersonalNoteGridItem key={note.id} note={note} onNoteClick={onNoteClick} />
                            ))}
                        </div>
                    )}
                    {view === "list" && (
                        <div className="personal-notes-list-container">
                            <div className="personal-notes-list">
                                {paginatedNotes.map(note => (
                                    <PersonalNoteListItem key={note.id} note={note} onNoteClick={onNoteClick} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={sentinelRef} style={{ height: 1 }} />
                </>
            )}

            <PersonalNotesFilterDrawer
                opened={showFilterDrawer}
                onClose={() => setShowFilterDrawer(false)}
            />
            <CreatePersonalNote
                showNoteForm={showNoteForm}
                setShowNoteForm={setShowNoteForm}
            />
        </div>
    );
};
