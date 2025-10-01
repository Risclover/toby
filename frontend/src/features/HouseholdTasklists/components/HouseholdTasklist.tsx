import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import type { TodoListType } from "@/store/todoSlice";
import { Avatar, Card, Divider, Progress, Tooltip } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklistTask } from "./HouseholdTasklistTask";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

type HouseholdTasklistProps = {
    list: TodoListType;
};

export function HouseholdTasklist({ list }: HouseholdTasklistProps) {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(
        user?.householdId ?? skipToken
    );

    const navigate = useNavigate();

    // Sort by sortIndex (stable tiebreaker by id)
    const todosSorted = useMemo(() => {
        const todos = list?.todos ?? [];
        return [...todos].sort((a: any, b: any) => {
            const ai = a.sortIndex ?? 0;
            const bi = b.sortIndex ?? 0;
            if (ai !== bi) return ai - bi;
            return (a.id ?? 0) - (b.id ?? 0);
        });
    }, [list?.todos]);

    // Uncompleted from the sorted array
    const uncompletedTodos = useMemo(() => {
        // If you specifically want only "in_progress" change predicate accordingly.
        return todosSorted.filter((t: any) => t.status !== "completed");
    }, [todosSorted]);

    const members =
        household?.members?.filter((m: any) => list?.memberIds?.includes(m?.id)) ??
        [];

    const VISIBLE = 3;
    const visible = members.slice(0, VISIBLE);
    const hidden = members.slice(VISIBLE);

    const nameOf = (p: any) => p?.displayName || p?.name || "Member";
    const avatarInitial = (p: any) =>
        (p?.displayName?.[0] || p?.name?.[0] || "?").toUpperCase();

    const todos = list?.todos ?? [];

    const { percent } = useMemo(() => {
        const total = todos.length;
        const done = todos.filter((t: any) => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { percent };
    }, [todos]);

    const navigateToTasklistPage = () => {
        navigate(`/tasklists/${list.id}`);
    };

    if (!list?.memberIds?.includes(user?.id)) return null;

    const remainingCount = Math.max(0, (uncompletedTodos?.length ?? 0) - 3);

    return (
        <Card
            className="household-tasklist"
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            onClick={navigateToTasklistPage}
        >
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
                    <Progress color="cyan" value={percent} />
                </div>
                {percent}%
            </div>

            {uncompletedTodos?.slice(0, 3).map((todo: any) => (
                <HouseholdTasklistTask key={todo.id} task={todo} />
            ))}

            {remainingCount > 0 && <Divider my="md" />}

            {remainingCount > 0 && (
                <div className="household-tasklist-bottom">
                    + {remainingCount} more task{remainingCount > 1 && "s"}
                </div>
            )}
        </Card>
    );
}
