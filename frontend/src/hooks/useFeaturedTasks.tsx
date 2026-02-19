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
        if (!tasks || !settings) return [];

        const {
            showCompleted,
            justMeFilter,
            importantOnly,
            urgencyFilter,
            sortOrder,
            maxItems
        } = settings;

        // 1. FILTERING
        let result = tasks.filter(task => {
            // A. Completed Filter
            // If showCompleted is false, we HIDE completed tasks.
            // (We check status !== "completed" to be safe against other statuses)
            if (!showCompleted && task.status === "completed") {
                return false;
            }

            // B. Assignee Filter (Just Me)
            // If justMeFilter is true, task must be assigned to current user
            if (justMeFilter) {
                // 1. Is the list explicitly shared with others?
                const isSharedList = tasklist?.memberIds && tasklist.memberIds.length > 1;

                // 2. If it IS shared, enforce task assignment
                if (isSharedList) {
                    // Task must be assigned specifically to me
                    if (task.assignedToId !== currentUserId) {
                        return false;
                    }
                }

                // 3. If list is private (memberIds only has me), 
                // ALL tasks are implicitly "mine", so we don't filter them out.
            }

            // C. Importance Filter
            // If importantOnly is true, task must be important
            if (importantOnly && !task.isImportant) {
                return false;
            }

            // D. Urgency Filters (Overdue, Due Today, Due Soon)
            const { overdue, dueToday, dueSoon } = urgencyFilter;

            // Only apply urgency logic if at least one filter is checked
            const isUrgencyActive = overdue || dueToday || dueSoon;

            if (isUrgencyActive) {
                // If a task has no due date, it cannot match any urgency filter
                if (!task.dueDate) return false;

                const taskDate = task.dueDate; // Assuming YYYY-MM-DD string
                const today = getTodayString();
                const nextWeek = getFutureString(7); // "Soon" usually means next 7 days

                const isOverdue = taskDate < today;
                const isDueToday = taskDate === today;
                const isDueSoon = taskDate > today && taskDate <= nextWeek;

                // Pass if it matches ANY of the checked boxes
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
            // If statuses are different, prioritize "in_progress" (incomplete)
            if (a.status !== b.status) {
                if (a.status === "completed") return 1; // a is completed -> push down
                if (b.status === "completed") return -1; // b is completed -> push down
            }

            // SECONDARY SORT: Apply user selected sort order
            switch (sortOrder) {
                case "alphabetical":
                    return String(a.title).localeCompare(String(b.title));

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
        // If maxItems is 0 or -1 (unlimited), don't slice. Otherwise, slice.
        if (maxItems > 0) {
            result = result.slice(0, maxItems);
        }

        return result;

    }, [tasks, settings, currentUserId]);
};
