import { useState, useEffect, useRef } from "react";
import { useTaskFiltering, type SortOption, type TaskFilters } from "./useTasklistFiltering";
import { useTasklistStats } from "./useTasklistStats";
import { useTasklistTheme } from "./useTasklistTheme";
import { type TasklistType } from "@/store/taskSlice";

export const useMobileTasklistController = (tasklist?: TasklistType) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [showCompleted, setShowCompleted] = useState<boolean | undefined>(false);
    const [showTasklistSettings, setShowTasklistSettings] = useState(false);
    const [showReorderMode, setShowReorderMode] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [sortOption, setSortOption] = useState<SortOption | string>("");
    const [filters, setFilters] = useState<TaskFilters>({
        importance: "all",
        assignedToId: null,
        time: "all",
    });

    // Shared Logic Hooks
    useTasklistTheme(tasklist?.color);
    const { percent, uncompleted, completed, totalCount } = useTasklistStats(tasklist?.tasks);

    // Sync defaults from API
    useEffect(() => {
        if (tasklist?.defaultFilters) setFilters(tasklist.defaultFilters);
        if (tasklist?.defaultSortOrder) setSortOption(tasklist.defaultSortOrder as SortOption);
        if (tasklist?.showCompleted !== undefined) setShowCompleted(tasklist.showCompleted);
    }, [tasklist?.defaultFilters, tasklist?.defaultSortOrder, tasklist?.showCompleted]);

    // Filtering
    const filteredTasks = useTaskFiltering(uncompleted, searchValue, sortOption, filters);
    const filteredCompleted = useTaskFiltering(completed, searchValue, sortOption, filters);

    return {
        inputRef,
        state: {
            showCompleted, setShowCompleted,
            showTasklistSettings, setShowTasklistSettings,
            showReorderMode, setShowReorderMode,
            searchValue, setSearchValue,
            sortOption, setSortOption,
            filters, setFilters
        },
        data: {
            percent,
            uncompleted,
            completed,
            filteredTasks,
            filteredCompleted,
            isEmpty: totalCount === 0
        }
    };
};