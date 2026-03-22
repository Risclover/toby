import { Avatar, Tooltip } from "@mantine/core";
import { useMemo } from "react";

interface Member {
    id: string | number;
    displayName?: string;
    name?: string;
    profileImg?: string;
}

interface MemberAvatarGroupProps {
    members: Member[];
    limit?: number;
}

export const MemberAvatarGroup = ({ members, limit = 2 }: MemberAvatarGroupProps) => {
    const visible = useMemo(() => members.slice(0, limit), [members, limit]);
    const hidden = useMemo(() => members.slice(limit), [members, limit]);

    const getName = (p: Member) => p?.displayName || p?.name || "Member";
    const getInitial = (p: Member) => (getName(p)[0] || "?").toUpperCase();

    const handleAvatarClick = (e: React.MouseEvent | React.KeyboardEvent, id: string | number) => {
        e.stopPropagation();
        window.open(`/profile/${id}`, "_blank");
    };

    return (
        <Tooltip.Group openDelay={300} closeDelay={100}>
            <Avatar.Group spacing="sm">
                {visible.map((person) => (
                    <Tooltip
                        key={person.id}
                        label={getName(person)}
                        withArrow
                        events={{ hover: true, focus: true, touch: false }}
                    >
                        <Avatar
                            tabIndex={0}
                            src={person.profileImg || undefined}
                            radius="xl"
                            size="sm"
                            onClick={(e) => handleAvatarClick(e, person.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") handleAvatarClick(e, person.id);
                            }}
                        >
                            {!person.profileImg && getInitial(person)}
                        </Avatar>
                    </Tooltip>
                ))}

                {hidden.length > 0 && (
                    <Tooltip
                        withArrow
                        label={
                            <div>
                                {hidden.map((p) => (
                                    <div key={p.id}>{getName(p)}</div>
                                ))}
                            </div>
                        }
                    >
                        <Avatar className="clickable-avatar" radius="xl" size="sm">
                            +{hidden.length}
                        </Avatar>
                    </Tooltip>
                )}
            </Avatar.Group>
        </Tooltip.Group>
    );
};