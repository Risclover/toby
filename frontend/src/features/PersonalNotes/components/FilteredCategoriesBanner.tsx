import { useEffect, useRef } from "react";
import { ActionIcon } from "@mantine/core";
import { AnimatePresence, motion } from "framer-motion";

import { PersonalNoteCategoryPill } from "./PersonalNoteCategoryPill";
import type { NotesFilterState } from "../hooks";
import type { PersonalNoteCategory } from "@/store";

import { FaXmark } from "react-icons/fa6";

type Props = {
    /** All note categories */
    categories: PersonalNoteCategory[] | undefined;
    /** Active filters */
    filters: NotesFilterState;
    /** Handler for updating active filters */
    updateFilters: (next: Partial<NotesFilterState>) => void
}

/** Banner of categories that appears when categories are filtered */
export const FilteredCategoriesBanner = ({ filters, categories, updateFilters }: Props) => {
    /** Required for smooth entrance animation */
    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    return (
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
    )
}