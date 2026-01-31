import { useMemo } from "react";
import { type TasklistType } from "@/store/taskSlice";

interface HouseholdTasklistLogicProps {
    list: TasklistType;
    uncompleted: any[];
    householdMembers?: any[];
}

export const useHouseholdTasklistLogic = ({
    list,
    uncompleted,
    householdMembers
}: HouseholdTasklistLogicProps) => {

    // 1. Sort Logic (Specific to card uncompleted view)
    const tasksSorted = useMemo(() => {
        return [...uncompleted].sort((a: any, b: any) => {
            const ai = a.sortIndex ?? 0;
            const bi = b.sortIndex ?? 0;
            if (ai !== bi) return ai - bi;
            return (a.id ?? 0) - (b.id ?? 0);
        });
    }, [uncompleted]);

    // 2. Member Filter Logic
    const listMembers = useMemo(() =>
        householdMembers?.filter((m: any) => list?.memberIds?.includes(m?.id)) ?? [],
        [householdMembers, list?.memberIds]);

    // 3. Derived UI values
    const remainingCount = Math.max(0, uncompleted.length - 3);

    return {
        tasksSorted,
        listMembers,
        remainingCount
    };
};