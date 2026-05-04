import { useParams } from "react-router-dom";
import { useGetUserNoteCategoriesQuery } from "@/store";
import type { NotesFilterState } from "./useNotesFilter";

type UseCategoryFilterSectionBodyProps = {
    /** Active filters */
    filters: NotesFilterState;
    /** Handler for changing active filters */
    updateFilters: (next: Partial<NotesFilterState>) => void
}

/** Hook for managing the body of the category filter section in the personal notes page */
export const useCategoryFilterSectionBody = ({ filters, updateFilters }: UseCategoryFilterSectionBodyProps) => {
    const { userId } = useParams();
    const { data: categories } = useGetUserNoteCategoriesQuery(Number(userId));

    const toggle = (id: number) => {
        const already = filters.categoryIds.includes(id);

        updateFilters({
            categoryIds: already
                ? filters.categoryIds.filter(existing => existing !== id)
                : [...filters.categoryIds, id],
        });
    };

    return {
        toggle,
        categories
    }
}