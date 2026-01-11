import { useMemo } from 'react';
import { type Todo } from '@/store/todoSlice'; // Checked path
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// 1. Updated Sort Options
export type SortOption =
    | "Alphabetical"
    | "Due Date"
    | "Importance"
    | "Newest" | "";

export type TimeFilter = "past_due" | "today" | "tomorrow" | "this_week" | "this_month" | "all";

export interface TaskFilters {
    importance: "all" | "important";
    assignedToId: number | null;
    time: TimeFilter;
}

export const useTaskFiltering = (
    todos: Todo[] | undefined,
    searchValue: string,
    sortOption: SortOption,
    filters: TaskFilters
) => {
    return useMemo(() => {
        if (!todos) return [];

        let result = [...todos];
        const now = dayjs();

        // --- FILTERING ---

        // 1. Search
        if (searchValue.trim()) {
            const lower = searchValue.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(lower) ||
                t.description?.toLowerCase().includes(lower)
            );
        }

        // 2. Importance
        if (filters.importance === 'important') {
            result = result.filter(t => t.isImportant);
        }

        // 3. Assignee
        if (filters.assignedToId) {
            result = result.filter(t => t.assignedToId === filters.assignedToId);
        }

        // 4. Time / Due Date
        if (filters.time !== 'all') {
            result = result.filter(t => {
                if (!t.dueDate) return false;
                const d = dayjs(t.dueDate);

                switch (filters.time) {
                    case 'past_due':
                        return d.isBefore(now, 'day') && t.status !== 'completed';
                    case 'today':
                        return d.isSame(now, 'day');
                    case 'tomorrow':
                        return d.isSame(now.add(1, 'day'), 'day');
                    case 'this_week':
                        return d.isSameOrAfter(now, 'day') && d.isSameOrBefore(now.endOf('week'), 'day');
                    case 'this_month':
                        return d.isSame(now, 'month');
                    default:
                        return true;
                }
            });
        }

        // --- SORTING ---

        if (sortOption) {
            result.sort((a, b) => {
                switch (sortOption) {
                    case "Alphabetical":
                        return a.title.localeCompare(b.title);

                    case "Due Date":
                        // Put tasks with NO due date at the bottom
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return dayjs(a.dueDate).diff(dayjs(b.dueDate));

                    case "Newest":
                        // Newest created first
                        return dayjs(b.createdAt).diff(dayjs(a.createdAt));

                    case "Importance":
                        // Primary: Importance (True first)
                        if (a.isImportant !== b.isImportant) {
                            return Number(b.isImportant) - Number(a.isImportant);
                        }
                        // Secondary: Due Date (Earliest first)
                        if (a.dueDate && b.dueDate) {
                            return dayjs(a.dueDate).diff(dayjs(b.dueDate));
                        }
                        // Tasks with dates come before tasks without dates
                        if (a.dueDate) return -1;
                        if (b.dueDate) return 1;
                        return 0;

                    default:
                        return 0;
                }
            });
        } else {
            // Default (Manual) Sort: SortIndex
            result.sort((a, b) => a.sortIndex - b.sortIndex);
        }

        return result;
    }, [todos, searchValue, sortOption, filters]);
};
