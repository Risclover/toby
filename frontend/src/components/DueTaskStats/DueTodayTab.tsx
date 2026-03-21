import { Button, Checkbox, Group, Tabs, Transition } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useRef, useState } from "react"
import { TimeSensitiveTask } from "./TimeSensitiveTask"
import type { OverdueTask } from "@/store"
import { useIsSmallScreen } from "@/hooks"
import { useCompleteTaskMutation, useDeleteTaskMutation } from "@/store"

export const DueTodayTab = ({ tasks }: { tasks: OverdueTask[] }) => {
    const isSmall = useIsSmallScreen(425);
    const [completeTask] = useCompleteTaskMutation();
    const [deleteTask] = useDeleteTaskMutation();

    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
    const [pendingCompleteIds, setPendingCompleteIds] = useState<Set<number>>(new Set());

    const pendingDeleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingCompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const allChecked = tasks.length > 0 && checkedIds.size === tasks.length;
    const indeterminate = checkedIds.size > 0 && !allChecked;

    const visibleTasks = tasks.filter(t => !pendingDeleteIds.has(t.id) && !pendingCompleteIds.has(t.id));

    const handleSelectAll = () => {
        setCheckedIds(allChecked ? new Set() : new Set(visibleTasks.map(t => t.id)));
    };

    const handleToggle = (id: number) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleMassDelete = () => {
        const ids = new Set(checkedIds);
        setPendingDeleteIds(ids);
        setCheckedIds(new Set());

        pendingDeleteRef.current = setTimeout(async () => {
            const selected = tasks.filter(t => ids.has(t.id));
            await Promise.all(
                selected.map(t => deleteTask({ taskId: t.id, listId: t.tasklist_id }))
            );
            setPendingDeleteIds(new Set());
        }, 5000);

        const notifId = notifications.show({
            message: (
                <Group justify="space-between" align="center">
                    <span>{`Removed ${ids.size} ${ids.size === 1 ? 'task' : 'tasks'}`}</span>
                    <Button
                        size="xs"
                        color="rgb(5,5,73)"
                        variant="light"
                        onClick={() => {
                            if (pendingDeleteRef.current) clearTimeout(pendingDeleteRef.current);
                            setPendingDeleteIds(new Set());
                            notifications.hide(notifId);
                        }}
                    >
                        Undo
                    </Button>
                </Group>
            ),
            autoClose: 5000,
            withCloseButton: false,
            color: "rgb(5, 5, 73)"
        });
    };

    const handleMassComplete = () => {
        const ids = new Set(checkedIds);
        setPendingCompleteIds(ids);
        setCheckedIds(new Set());

        pendingCompleteRef.current = setTimeout(async () => {
            const selected = tasks.filter(t => ids.has(t.id));
            await Promise.all(
                selected.map(t => completeTask({ taskId: t.id, listId: t.tasklist_id, completed: true }))
            );
            setPendingCompleteIds(new Set());
        }, 5000);

        const notifId = notifications.show({
            message: (
                <Group justify="space-between" align="center">
                    <span>{`Completed ${ids.size} ${ids.size === 1 ? 'task' : 'tasks'}`}</span>
                    <Button
                        size="xs"
                        color="rgb(5,5,73)"
                        variant="light"
                        onClick={() => {
                            if (pendingCompleteRef.current) clearTimeout(pendingCompleteRef.current);
                            setPendingCompleteIds(new Set());
                            notifications.hide(notifId);
                        }}
                    >
                        Undo
                    </Button>
                </Group>
            ),
            autoClose: 5000,
            withCloseButton: false,
            color: "rgb(5, 5, 73)"
        });
    };

    return (
        <Tabs.Panel value="due_today">
            {visibleTasks.length > 0 && <div className="list-head">
                <div className="list-head-left">
                    <Checkbox
                        color="rgb(3, 3, 75)"
                        checked={allChecked}
                        indeterminate={indeterminate}
                        onChange={handleSelectAll}
                        label="Select all"
                        size="xs"
                        styles={{ label: { fontSize: "14px", paddingLeft: "0.5rem" } }}
                    />
                    {checkedIds.size > 0 && <span>{`(${checkedIds.size} selected)`}</span>}
                </div>
                <Transition mounted={checkedIds.size > 0} transition="fade-left" duration={250} timingFunction="ease">
                    {(styles) => (
                        <Group gap={0} style={styles}>
                            <Button radius="sm" size="13px" p=".325rem .5rem" h="auto" variant="light" fw={500} color="red" onClick={handleMassDelete}>Delete</Button>
                            <Button ml=".5rem" radius="sm" size="13px" p=".325rem .5rem" h="auto" variant="filled" fw={500} color="rgb(5, 5, 73)" onClick={handleMassComplete}>Complete</Button>
                        </Group>
                    )}
                </Transition>
            </div>}
            <ul className="time-sensitive-tasks">
                {visibleTasks.length === 0 ? <div className="sensitive-tasks-empty">None of your tasks are due today.</div> : visibleTasks.map(task => (
                    <TimeSensitiveTask
                        key={task.id}
                        task={task}
                        checked={checkedIds.has(task.id)}
                        onToggle={handleToggle}
                    />
                ))}
            </ul>
        </Tabs.Panel>
    )
}