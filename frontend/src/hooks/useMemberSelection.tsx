// hooks/useMemberSelection.ts
import { useEffect, useMemo, useState } from "react";

export type UserLite = { id: number; displayName: string; profileImg: string; };

// hooks/useMemberSelection.ts
// hooks/useMemberSelection.ts
export function useMemberSelection(members?: UserLite[]) {
    const [selected, setSelected] = useState<Set<number>>(new Set());
    // Add a explicit state to track if we are in "All Members" mode
    const [isAllMode, setIsAllMode] = useState(true);

    useEffect(() => {
        if (!members) return;
        setSelected(new Set(members.map((m) => m.id)));
        setIsAllMode(true);
    }, [members]);

    const allCount = members?.length ?? 0;

    // Auto-close and switch to "All Mode" if user manually checks everyone
    useEffect(() => {
        if (allCount > 0 && selected.size === allCount) {
            setIsAllMode(true);
        }
    }, [selected, allCount]);

    const toggleAll = (checked: boolean) => {
        if (!members) return;
        setIsAllMode(checked);
        if (checked) {
            setSelected(new Set(members.map((m) => m.id)));
        } else {
            // When unchecking "All", we empty the list so they can pick
            setSelected(new Set());
        }
    };

    const toggleOne = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        // We don't set setIsAllMode(false) here because if they 
        // uncheck one, the useEffect above won't trigger, 
        // and isAllMode is already false if the list was open.
    };

    const someSelected = selected.size > 0 && selected.size < allCount;
    const memberIds = useMemo(() => Array.from(selected), [selected]);

    return {
        allMembers: isAllMode, // Use the explicit state for the UI
        someSelected,
        memberIds,
        toggleAll,
        toggleOne,
        selected
    };
}