import { useState } from "react";

type UseMemberFilterProps = {
    memberIds: number[];
};

/** `memberIds` must be referentially stable (memoize it), as callers use `selectedIds` as a memo dependency. */
export const useMemberFilter = ({ memberIds }: UseMemberFilterProps) => {
    const [selection, setSelection] = useState<number[] | null>(null);

    // null means "never touched": everyone is selected.
    const selectedIds = selection ?? memberIds;
    const isAllSelected = memberIds.length > 0 && memberIds.every((id) => selectedIds.includes(id));

    const toggleMember = (id: number) => {
        setSelection((current) => {
            const base = current ?? memberIds;
            return base.includes(id) ? base.filter((memberId) => memberId !== id) : [...base, id];
        });
    };

    const toggleAll = () => setSelection(isAllSelected ? [] : memberIds);

    return { selectedIds, isAllSelected, toggleMember, toggleAll };
};