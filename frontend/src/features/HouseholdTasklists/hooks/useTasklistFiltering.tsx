import { useMemo } from 'react';
import { type Task } from '@/store/taskSlice';
import dayjs from 'dayjs';
// We need these plugins for the logic to work safely
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export type SortOption =
    | "Alphabetical"
    | "Due date"
    | "Importance"
    | "Newest"
    | "" | string;

export type TimeFilter = "past_due" | "today" | "tomorrow" | "this_week" | "this_month" | "all";

export interface TaskFilters {
    importance: "all" | "important";
    assignedToId: number | null;
    time: TimeFilter;
}

export const useTaskFiltering = (
    tasks: Task[] | undefined,
    searchValue: string,
    sortOption: SortOption,
    filters: TaskFilters
) => {
    return useMemo(() => {
        if (!tasks) return [];

        let result = [...tasks];
        // Use 'now' as the reference point for all comparisons
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
                // If task has no due date, it never matches a time filter (unless the filter is 'all')
                if (!t.dueDate) return false;

                const taskDate = dayjs(t.dueDate);
                if (!taskDate.isValid()) return false;

                switch (filters.time) {
                    case 'past_due':
                        // Strictly before the start of today, AND not completed
                        return taskDate.isBefore(now, 'day') && t.status !== 'completed';

                    case 'today':
                        // Exactly matches today's calendar date
                        return taskDate.isSame(now, 'day');

                    case 'tomorrow':
                        // Exactly matches tomorrow's calendar date
                        return taskDate.isSame(now.add(1, 'day'), 'day');

                    case 'this_week':
                        // OLD: return taskDate.isSame(now, 'week');
                        // Problem: On Saturday, this hides Sunday.

                        // NEW: "Next 7 Days" (Rolling Window)
                        // This includes Today, Tomorrow, and the next 5 days regardless of the day of the week.
                        return taskDate.isSameOrAfter(now, 'day') && taskDate.isBefore(now.add(7, 'day'), 'day');

                    case 'this_month':
                        // Matches the current month
                        return taskDate.isSame(now, 'month');

                    default:
                        return true;
                }
            });
        }

        // --- SORTING ---

        if (sortOption) {
            result.sort((a, b) => {
                switch (sortOption) {
                    case "alphabetical":
                    case "Alphabetical":
                        return a.title.localeCompare(b.title);

                    case "due_date":
                    case "Due date":
                        // Put tasks with NO due date at the bottom
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return dayjs(a.dueDate).diff(dayjs(b.dueDate));

                    case "newest":
                    case "Newest":
                        // Newest created first (descending)
                        return dayjs(b.createdAt).diff(dayjs(a.createdAt));

                    case "importance":
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
    }, [tasks, searchValue, sortOption, filters]);
};
