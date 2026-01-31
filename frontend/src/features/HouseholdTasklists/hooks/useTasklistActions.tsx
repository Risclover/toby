import { useNavigate } from "react-router-dom";
import { useFeatureTasklistMutation } from "@/store/userSlice";

export const useTasklistActions = (listId: number, userId?: number, householdId?: number) => {
    const navigate = useNavigate();
    const [featureTasklist] = useFeatureTasklistMutation();

    const navigateToTasklistPage = () => navigate(`/tasklists/${listId}`);

    const toggleFeatured = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (userId && householdId) {
            featureTasklist({ userId, householdId, listId });
        }
    };

    const handleStarKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            if (e.key === " ") e.preventDefault();
            toggleFeatured(e);
        }
    };

    return {
        navigateToTasklistPage,
        toggleFeatured,
        handleStarKeyDown
    };
};