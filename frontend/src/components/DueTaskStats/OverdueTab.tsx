import { Button, Checkbox, Group, Tabs, Transition } from "@mantine/core"
import { useEffect, useState } from "react"
import { TimeSensitiveTask } from "./TimeSensitiveTask"
import { useCompleteTaskMutation, useDeleteTaskMutation, type OverdueTask } from "@/store"
import { useIsSmallScreen } from "@/hooks"

export const OverdueTab = ({ tasks }: { tasks: OverdueTask[] }) => {
    const [completeTask] = useCompleteTaskMutation();
    const [deleteTask] = useDeleteTaskMutation();
    const isSmall = useIsSmallScreen(425);

    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [numSelected, setNumSelected] = useState(0);

    const allChecked = tasks.length > 0 && checkedIds.size === tasks.length;
    const indeterminate = checkedIds.size > 0 && !allChecked;

    useEffect(() => {
        console.log('checkedIds:', checkedIds);
    }, [checkedIds])

    const handleSelectAll = () => {
        setCheckedIds(allChecked ? new Set() : new Set(tasks.map(t => t.id)));
    };

    const handleToggle = (id: number) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleMassComplete = async () => {
        const selected = tasks.filter(t => checkedIds.has(t.id));
        await Promise.all(
            selected.map(t => completeTask({ taskId: t.id, listId: t.tasklist_id, completed: true }))
        );
        setCheckedIds(new Set());
    };

    const handleMassDelete = async () => {
        const selected = tasks.filter(t => checkedIds.has(t.id));
        await Promise.all(
            selected.map(t => deleteTask({ taskId: t.id, listId: t.tasklist_id }))
        );
        setCheckedIds(new Set());
    };

    return (
        <Tabs.Panel value="overdue">
            {tasks.length > 0 && <div className="list-head">
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
            <div className="time-sensitive-tasks-container">
                <ul className="time-sensitive-tasks">
                    {tasks.length === 0 ? <div className="sensitive-tasks-empty">You have no overdue tasks - good job!</div> : tasks.map(task => (
                        <TimeSensitiveTask
                            key={task.id}
                            task={task}
                            checked={checkedIds.has(task.id)}
                            onToggle={handleToggle}
                        />
                    ))}
                </ul>
            </div>
        </Tabs.Panel>
    )
}