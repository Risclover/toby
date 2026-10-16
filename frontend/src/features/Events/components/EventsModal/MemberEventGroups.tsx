import type { DayEventRowSharedProps, UserGroup } from "../../types";
import { EventsModalEmptyState } from "./EventsModalEmptyState";
import { MemberEventSection } from "./MemberEventSection";

type Props = {
    groups: UserGroup[];
    currentUserId?: number;
    rowProps: DayEventRowSharedProps;
};

export const MemberEventGroups = ({ groups, currentUserId, rowProps }: Props) => {
    if (groups.length === 0) return <EventsModalEmptyState />;

    return (
        <>
            {groups.map(({ member, events }) => (
                <MemberEventSection
                    key={member.id}
                    member={member}
                    events={events}
                    isCurrentUser={member.id === currentUserId}
                    rowProps={rowProps}
                />
            ))}
        </>
    );
};