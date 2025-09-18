import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import type { TodoListType } from "@/store/todoSlice";
import { Avatar, Card, Checkbox, Progress, Tooltip } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklistTask } from "./HouseholdTasklistTask";
import { useMemo } from "react";

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

    console.log('list:', list.todos)

    const nameOf = (p: any) => p?.displayName || p?.username || "Member";
    const avatarInitial = (p: any) =>
        (p?.displayName?.[0] || p?.username?.[0] || "?").toUpperCase();

    const todos = list?.todos ?? [];

    const { done, total, percent } = useMemo(() => {
        const total = todos.length;
        const done = todos.filter(t => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { done, total, percent };
    }, [todos]);

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
                                    <div>
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

            <div className="progress">
                <div className="progress-left">
                    <Progress color="violet" value={percent} />
                </div>
                {percent}%
            </div>
            {list.todos?.map((todo) => todo.status !== "completed" && <HouseholdTasklistTask task={todo} />)}
            {list?.todos && (list?.todos?.length - 3) > 0 && <div className="household-tasklist-bottom">
                + 1 more task{list?.todos.length > 1 && "s"}
            </div>}
        </Card>
    );
}
