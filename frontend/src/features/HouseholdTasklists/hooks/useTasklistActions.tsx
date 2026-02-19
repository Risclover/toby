import { useFeatureTasklistMutation } from "@/store/userSettingSlice";
import { useNavigate } from "react-router-dom";

export const useTasklistActions = (tasklistId: number, userId?: number, householdId?: number) => {
    const navigate = useNavigate();
    const [featureTasklist] = useFeatureTasklistMutation();

    const navigateToTasklistPage = () => navigate(`/tasklists/${tasklistId}`);

    const toggleFeatured = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (userId && householdId) {
            featureTasklist({ householdId, tasklistId });
        }
    };

    const handleStarKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFeatured(e);
        }
    };

    return {
        navigateToTasklistPage,
        toggleFeatured,
        handleStarKeyDown
    };
};