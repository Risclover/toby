import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import type { Task, TasklistType } from "@/store/taskSlice"
import { Avatar, Divider, Progress, Tooltip } from "@mantine/core";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklistTask } from "./HouseholdTasklistTask";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMobileTasklist } from "../../hooks/useMobileTasklist";

type HouseholdTasklistProps = {
    list: TasklistType;
};

/**
 * Wrapper Component:
 * Detects changes in the task order (via IDs and sortIndex) and forces
 * the content to remount. This ensures useMobileTasklist picks up the new order.
 */
export function HouseholdTasklist(props: HouseholdTasklistProps) {
    const tasks = props.list.tasks ?? [];

    // Create a unique signature for the current order
    const orderSignature = useMemo(() => {
        return tasks.map((t: any) => `${t.id}_${t.sortIndex ?? 0}`).join('|');
    }, [tasks]);

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
    const tasksSorted = useMemo(() => {
        const tasks = list?.tasks ?? [];
        return [...tasks].sort((a: any, b: any) => {
            const ai = a.sortIndex ?? 0;
            const bi = b.sortIndex ?? 0;
            if (ai !== bi) return ai - bi;
            return (a.id ?? 0) - (b.id ?? 0);
        });
    }, [list?.tasks]);

    // Uncompleted from the sorted array
    const uncompletedTasks = useMemo(() => {
        return tasksSorted.filter((t: any) => t.status !== "completed");
    }, [tasksSorted]);

    const completedTasks = useMemo(() => {
        return tasksSorted.filter((t: any) => t.status === "completed");
    }, [tasksSorted])

    const members =
        household?.members?.filter((m: any) => list?.memberIds?.includes(m?.id)) ??
        [];

    const VISIBLE = 2;
    const visible = members.slice(0, VISIBLE);
    const hidden = members.slice(VISIBLE);

    const nameOf = (p: any) => p?.displayName || p?.name || "Member";
    const avatarInitial = (p: any) =>
        (p?.displayName?.[0] || p?.name?.[0] || "?").toUpperCase();

    const items = list?.tasks ?? [];

    const { percent } = useMemo(() => {
        const total = items.length;
        const done = items.filter((t: any) => t.status === "completed").length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { percent };
    }, [items]);

    const navigateToTasklistPage = () => {
        navigate(`/tasklists/${list.id}`);
    };

    // Now initializes fresh whenever the parent wrapper changes the key
    const { tasks, moveTask } = useMobileTasklist({ initialTasks: uncompletedTasks });

    const remainingCount = Math.max(0, (uncompletedTasks?.length ?? 0) - 3);

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
                                <Avatar className="clickable-avatar" radius="xl" size="sm" style={{ fontSize: "3rem" }}>
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
                <span className="tasklists-list-empty-state">{tasks?.length === 0 && completedTasks.length === 0 ? "This is an empty list." : tasks?.length === 0 && completedTasks.length > 0 ? "🏅 All tasks completed!" : ""}</span>
                {tasks?.slice(0, 3).map((task: any) => (
                    <HouseholdTasklistTask
                        key={task.id}
                        task={task}
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
