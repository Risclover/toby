import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import type { TodoListType } from "@/store/todoSlice";
import { Avatar, Card, Progress, Tooltip } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";

type HouseholdTasklistProps = {
    list: TodoListType;
};

export function HouseholdTasklist({ list }: HouseholdTasklistProps) {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(
        user?.householdId ?? skipToken
    );

    const members =
        household?.members?.filter((m: any) => list?.memberIds?.includes(m?.id)) ??
        [];

    const VISIBLE = 3;
    const visible = members.slice(0, VISIBLE);
    const hidden = members.slice(VISIBLE);

    const nameOf = (p: any) => p?.displayName || p?.username || "Member";
    const avatarInitial = (p: any) =>
        (p?.displayName?.[0] || p?.username?.[0] || "?").toUpperCase();

    if (!list?.memberIds?.includes(user?.id)) return null;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <div className="tasklist-head">
                {list.title}
                <Tooltip.Group openDelay={300} closeDelay={100}>
                    <Avatar.Group spacing="sm">
                        {visible.map((person: any) => (
                            <Tooltip key={person.id} label={nameOf(person)} withArrow>
                                <Avatar
                                    src={person.profileImg || undefined}
                                    radius="xl"
                                    size="sm"
                                >
                                    {!person.profileImg && avatarInitial(person)}
                                </Avatar>
                            </Tooltip>
                        ))}

                        {hidden.length > 0 && (
                            <Tooltip
                                withArrow
                                label={
                                    <div style={{ lineHeight: 1.2 }}>
                                        {hidden.map((p: any) => (
                                            <div key={p.id}>{nameOf(p)}</div>
                                        ))}
                                    </div>
                                }
                            >
                                <Avatar radius="xl" size="sm">
                                    +{hidden.length}
                                </Avatar>
                            </Tooltip>
                        )}
                    </Avatar.Group>
                </Tooltip.Group>
            </div>

            <Progress value={0} />
        </Card>
    );
}
