// hooks/useMemberSelection.ts
import { useEffect, useMemo, useRef, useState } from "react";

export type UserLite = { id: number; displayName: string; profileImg: string; };

export function useMemberSelection(members?: UserLite[]) {
    const [selected, setSelected] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!members) return;
        setSelected(new Set(members.map((m) => m.id)));
    }, [members]);

    const allCount = members?.length ?? 0;
    const selectedCount = selected.size;
    const allMembers = allCount > 0 && selectedCount === allCount;
    const someSelected = selectedCount > 0 && selectedCount < allCount;

    const toggleAll = (checked: boolean) => {
        if (!members) return;
        setSelected(checked ? new Set(members.map((m) => m.id)) : new Set());
    };

    const toggleOne = (id: number) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const memberIds = useMemo(() => Array.from(selected), [selected]);

    return { allMembers, someSelected, memberIds, toggleAll, toggleOne, selected };
}
