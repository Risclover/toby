import { useMemo } from "react";
import { getTaskStats } from "../utils/getTaskStats";
import type { Task } from "@/store/taskSlice";

export const useTasklistStats = (tasks: Task[] = []) => {
    return useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "completed");
        const uncompleted = tasks.filter((t) => t.status === "in_progress");

        const rawPercent = total ? (completed.length / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

        // Reuse your existing util for overdue/today/soon
        const timeStats = getTaskStats({ tasks: uncompleted });

        return {
            percent,
            totalCount: total,
            completedCount: completed.length,
            uncompleted,
            completed,
            ...timeStats
        };
    }, [tasks]);
};