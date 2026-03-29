// TimeSensitiveTasksTab.tsx
import { Checkbox, Tabs } from "@mantine/core"
import { TimeSensitiveTask } from "./TimeSensitiveTask"

type TaskItem = {
    id: number
    title: string
    due_date: string
    tasklist_id: number
    tasklist_title: string
}

type Props = {
    tabValue: string
    tasks: TaskItem[]
    emptyMsg: string
    checkedIds: Set<number>
    allChecked: boolean
    indeterminate: boolean
    visibleTasks: TaskItem[]
    onSelectAll: () => void
    onToggle: (id: number) => void
}

export const TimeSensitiveTasksTab = ({
    tabValue,
    tasks,
    emptyMsg,
    checkedIds,
    allChecked,
    indeterminate,
    visibleTasks,
    onSelectAll,
    onToggle,
}: Props) => {
    return (
        <Tabs.Panel value={tabValue}>
            {visibleTasks.length > 0 && (
                <div className="list-head">
                    <div className="list-head-left">
                        <Checkbox
                            color={
                                tabValue === "overdue"
                                    ? "var(--mantine-color-red-7)"
                                    : tabValue === "due_today"
                                        ? "var(--mantine-color-orange-7)"
                                        : "var(--mantine-color-blue-7)"
                            }
                            checked={allChecked}
                            indeterminate={indeterminate}
                            onChange={onSelectAll}
                            label="Select all"
                            size="xs"
                            styles={{ label: { fontSize: "14px", paddingLeft: "0.5rem" } }}
                        />
                        {checkedIds.size > 0 && <span>{`(${checkedIds.size} selected)`}</span>}
                    </div>
                </div>
            )}

            <ul className="time-sensitive-tasks">
                {visibleTasks.length === 0 ? (
                    <div className="sensitive-tasks-empty">{emptyMsg}</div>
                ) : (
                    visibleTasks.map(task => (
                        <TimeSensitiveTask
                            key={task.id}
                            task={task}
                            checked={checkedIds.has(task.id)}
                            onToggle={onToggle}
                            tab={tabValue}
                        />
                    ))
                )}
            </ul>
        </Tabs.Panel>
    )
}