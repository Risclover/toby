import { useMemo } from "react";
import { type Task, type TasklistType } from "@/store"; // Adjust import to match your project
import { type FeaturedTasklistSettings } from "@/store/userSettingSlice";

// Helper to get formatted date strings (YYYY-MM-DD)
const getTodayString = () => new Date().toISOString().split('T')[0];
const getFutureString = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

export const useFeaturedTasks = (
    tasks: Task[] | undefined,
    tasklist: TasklistType | undefined,
    settings: FeaturedTasklistSettings | undefined,
    currentUserId: number | undefined
) => {
    return useMemo(() => {
        if (!tasks || !settings || !tasklist) return [];

        const {
            showCompleted,
            justMeFilter,
            importantOnly,
            urgencyFilter,
            sortOrder,
            maxItems
        } = settings;

        // ✅ Preserve the original input order for manual sorting
        const inputTasks = tasks.slice(); // shallow copy

        // 1. FILTERING (same as before)
        let result = inputTasks.filter(task => {
            // A. Completed Filter
            if (!showCompleted && task.status === "completed") {
                return false;
            }

            // B. Assignee Filter (Just Me)
            if (justMeFilter) {
                const isSharedList = tasklist?.memberIds && tasklist.memberIds.length > 1;
                if (isSharedList) {
                    if (task.assignedToId !== currentUserId) {
                        return false;
                    }
                }
            }

            // C. Importance Filter
            if (importantOnly && !task.isImportant) {
                return false;
            }

            // D. Urgency Filters (Overdue, Due Today, Due Soon)
            const { overdue, dueToday, dueSoon } = urgencyFilter;
            const isUrgencyActive = overdue || dueToday || dueSoon;

            if (isUrgencyActive) {
                if (!task.dueDate) return false;

                const taskDate = task.dueDate;
                const today = getTodayString();
                const nextWeek = getFutureString(7);

                const isOverdue = taskDate < today;
                const isDueToday = taskDate === today;
                const isDueSoon = taskDate > today && taskDate <= nextWeek;

                const matchesOverdue = overdue && isOverdue;
                const matchesToday = dueToday && isDueToday;
                const matchesSoon = dueSoon && isDueSoon;

                if (!matchesOverdue && !matchesToday && !matchesSoon) {
                    return false;
                }
            }

            return true;
        });

        // 2. SORTING
        result.sort((a, b) => {
            // PRIMARY SORT: Incomplete first, Completed last
            if (a.status !== b.status) {
                if (a.status === "completed") return 1;
                if (b.status === "completed") return -1;
            }

            // SECONDARY SORT: Apply user selected sort order
            switch (sortOrder) {
                case "manual":
                    // ✅ NEW: Respect the list's manual order using sortIndex + fallback to input order
                    const indexA = a.sortIndex ?? inputTasks.findIndex(t => t.id === a.id);
                    const indexB = b.sortIndex ?? inputTasks.findIndex(t => t.id === b.id);
                    return indexA - indexB;

                case "alphabetical":
                    return a.title.localeCompare(b.title, undefined, {
                        numeric: true,  // ✅ Handles 1, 2, 10 correctly
                        sensitivity: 'base'  // Case-insensitive
                    });

                case "newest":
                    return b.id - a.id;

                case "oldest":
                    return a.id - b.id;

                case "importance":
                    return (a.isImportant === b.isImportant) ? 0 : a.isImportant ? -1 : 1;

                case "due_date":
                default:
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    const dateA = new Date(a.dueDate).getTime();
                    const dateB = new Date(b.dueDate).getTime();
                    return dateA - dateB;
            }
        });

        // 3. LIMITING
        if (maxItems > 0) {
            result = result.slice(0, maxItems);
        }

        return result;

    }, [tasks, tasklist, settings, currentUserId]);
};
