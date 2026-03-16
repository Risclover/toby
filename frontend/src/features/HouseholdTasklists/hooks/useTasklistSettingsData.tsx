import { useParams } from "react-router-dom";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useGetTasklistQuery } from "@/store/taskSlice";
import { useRef } from "react";
import { useHousehold } from "@/hooks/useHousehold";

export function useTasklistSettingsData() {
    const { tasklistId } = useParams();
    const tasklistTitleRef = useRef<HTMLInputElement>(null);

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: tasklist } = useGetTasklistQuery(Number(tasklistId));

    return {
        tasklistTitleRef,
        tasklistId: Number(tasklistId),
        user,
        household,
        tasklist,
    };
}
