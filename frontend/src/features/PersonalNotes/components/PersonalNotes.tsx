import { useParams } from "react-router-dom";
import { Button, Text } from "@mantine/core";

import { useNotesFilterContext } from "@/contexts";
import { PersonalNoteGridItem } from "./PersonalNoteGridItem";
import { PersonalNoteListItem } from "./PersonalNoteListItem";
import { PersonalNotesToolbar } from "./PersonalNotesToolbar";
import { PersonalNoteGridSkeleton, PersonalNoteListSkeleton } from "./PersonalNoteSkeletons";
import { FilteredCategoriesBanner } from "./FilteredCategoriesBanner";
import { useGetUserNotesQuery } from "@/store";

import "../styles/PersonalNotes.css";

const SKELETONS_COUNT = 12;

type Props = {
    /** Handler for clicking a note */
    onNoteClick: (id: string) => void;
};

/** Personal notes page - including notes toolbar (search, filters, 'create note' button) and notes list in selected view (list or grid). */
export const PersonalNotes = ({ onNoteClick }: Props) => {
    const { userId } = useParams();
    const { isLoading } = useGetUserNotesQuery(Number(userId));

    const {
        searchInput,
        setSearchInput,
        filters,
        updateFilters,
        resetFilters,
        isFiltered,
        paginatedNotes,
        totalCount,
        view,
        handleViewChange,
        isEmpty,
        sentinelRef,
        categories
    } = useNotesFilterContext();

    return (
        <div className="personal-notes-container">
            {/* Toolbar */}
            <div className="notes-controls-bar">
                {(!isEmpty || isFiltered) && !isLoading &&
                    <PersonalNotesToolbar
                        search={searchInput}
                        onSearchChange={setSearchInput}
                        isFiltered={isFiltered}
                        view={view}
                        onViewChange={handleViewChange}
                        sort={filters.sort}
                        onSortChange={(val) => updateFilters({ sort: val })}
                    />}
            </div>

            {/* Filtered category pills banner */}
            {filters.categoryIds.length > 0 && (
                <FilteredCategoriesBanner
                    filters={filters}
                    categories={categories}
                    updateFilters={updateFilters}
                />
            )}

            {/* Filter results count */}
            {isFiltered && (
                <div className="personal-notes-results-count">
                    <Text size="xs" c="dimmed" px="xs" mt={4}>
                        {totalCount} result{totalCount !== 1 ? "s" : ""} -
                        <Button
                            styles={{
                                root: {
                                    alignSelf: "center"
                                }
                            }}
                            p={0}
                            fw={500}
                            mb="4px"
                            h="auto"
                            size="compact-xs"
                            variant="transparent"
                            onClick={resetFilters}>
                            Clear filters
                        </Button>
                    </Text>
                </div>
            )}

            {/* Loading skeletons */}
            {isLoading
                ? (
                    <>
                        {/* Grid loading skeletons */}
                        {view === "grid" && (
                            <div className="personal-notes-grid">
                                {Array.from({ length: SKELETONS_COUNT }).map((_, i) => (
                                    <PersonalNoteGridSkeleton key={i} />
                                ))}
                            </div>
                        )}
                        {/* List loading skeletons */}
                        {view === "list" && (
                            <div className="personal-notes-list-container">
                                <div className="personal-notes-list">
                                    {Array.from({ length: SKELETONS_COUNT }).map((_, i) => (
                                        <PersonalNoteListSkeleton key={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )

                // Empty states
                : isEmpty
                    ? (
                        <div className="notes-empty-state">
                            <Text c="dimmed" size="md">
                                {isFiltered
                                    ? "No notes match your search or filters."
                                    : "This user hasn't created any notes yet."
                                }
                            </Text>
                            {isFiltered && (
                                <Button variant="subtle" size="xs" mt="xs" onClick={resetFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )

                    // Notes (grid and list views)
                    : (
                        <>
                            {/* Grid view notes */}
                            {view === "grid" && (
                                <div className="personal-notes-grid">
                                    {paginatedNotes.map(note => (
                                        <PersonalNoteGridItem key={note.id} note={note} onNoteClick={onNoteClick} />
                                    ))}
                                </div>
                            )}
                            {/* List view notes */}
                            {view === "list" && (
                                <div className="personal-notes-list-container">
                                    <div className="personal-notes-list">
                                        {paginatedNotes.map(note => (
                                            <PersonalNoteListItem key={note.id} note={note} onNoteClick={onNoteClick} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Needed for infinite scroll */}
                            <div ref={sentinelRef} style={{ height: 1 }} />
                        </>
                    )}
        </div>
    );
};