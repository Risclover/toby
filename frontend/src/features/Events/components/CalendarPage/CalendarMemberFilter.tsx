import { useCalendar } from "@/contexts";
import { MemberFilterRow } from "./MemberFilterRow";

export const CalendarMemberFilter = () => {
    const { members, memberFilter } = useCalendar();

    return (
        <MemberFilterRow
            members={members}
            selectedIds={memberFilter.selectedIds}
            onToggle={memberFilter.toggleMember}
            onToggleAll={memberFilter.toggleAll}
        />
    );
};