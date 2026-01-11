import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import type { TodoListType } from "@/store/todoSlice";
import { Avatar, Card, Divider, Progress, Tooltip } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklistTask } from "./HouseholdTasklistTask";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMobileTasklist } from "../../hooks/useMobileTasklist";
import { useDragMode } from "@/hooks/useDragMode";

type HouseholdTasklistProps = {
    list: TodoListType;
};

/**
 * Wrapper Component:
 * Detects changes in the task order (via IDs and sortIndex) and forces
 * the content to remount. This ensures useMobileTasklist picks up the new order.
 */
export function HouseholdTasklist(props: HouseholdTasklistProps) {
    const todos = props.list.todos ?? [];

    // Create a unique signature for the current order
    const orderSignature = useMemo(() => {
        return todos.map((t: any) => `${t.id}_${t.sortIndex ?? 0}`).join('|');
    }, [todos]);

    // The 'key' prop forces React to destroy and recreate the Content component
    // whenever the orderSignature changes.
    return <HouseholdTasklistContent key={orderSignature} {...props} />;
}

// This contains your original logic, renamed to 'Content'
function HouseholdTasklistContent({ list }: HouseholdTasklistProps) {
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
        return todosSorted.filter((t: any) => t.status !== "completed");
    }, [todosSorted]);

    const members =
        household?.members?.filter((m: any) => list?.memberIds?.includes(m?.id)) ??
        [];

    const VISIBLE = 2;
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

    // Now initializes fresh whenever the parent wrapper changes the key
    const { tasks, moveTask } = useMobileTasklist({ initialTasks: uncompletedTodos });


    if (!list?.memberIds?.includes(user?.id)) return null;

    const remainingCount = Math.max(0, (uncompletedTodos?.length ?? 0) - 3);

    return (
        <div
            className="mobile-home-notice-board mobile-tasklist-card"
            onClick={navigateToTasklistPage}
        >
            <div className="tasklist-head">
                <span className="tasklist-head-title">{list.title}</span>
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
                                <Avatar radius="xl" size="sm" style={{ fontSize: "3rem" }}>
                                    +{hidden.length}
                                </Avatar>
                            </Tooltip>
                        )}
                    </Avatar.Group>
                </Tooltip.Group>
            </div>
            <div className="tasklist-head-progress progress">
                <div className="progress-left">
                    <Progress color="cyan" value={percent} />
                </div>
                {percent}%
            </div>

            <div className="mobile-home-notice-board-content">
                {tasks?.slice(0, 3).map((todo: any) => (
                    <HouseholdTasklistTask
                        key={todo.id}
                        task={todo}
                        moveTask={moveTask}
                    />
                ))}

                {remainingCount > 0 && <Divider my="xs" />}

                {remainingCount > 0 && (
                    <div className="household-tasklist-bottom">
                        + {remainingCount} more task{remainingCount > 1 && "s"}
                    </div>
                )}
            </div>
        </div>
    );
}
