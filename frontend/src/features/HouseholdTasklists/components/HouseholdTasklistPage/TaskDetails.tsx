import { EditableTitle } from "@/component/EditableTitle";
import { useGetTodoListQuery, useUpdateTodoMutation } from "@/store/todoSlice";
import { Avatar, Drawer, Group, Select } from "@mantine/core"
import { useEffect, useState } from "react";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { DatePickerInput } from '@mantine/dates';
import { useGetHouseholdQuery } from "@/store/householdSlice";
import dayjs from 'dayjs';

type Props = {
    opened: boolean;
    close: () => void;
    taskId: number;
    listId: number;
    householdId?: number;
};

export const TaskDetails = ({ opened, close, taskId, listId, householdId }: Props) => {
    const [updateTodoTitle] = useUpdateTodoMutation()
    const [updateTodo] = useUpdateTodoMutation();
    const { data: household } = useGetHouseholdQuery(householdId)
    const { data: todoList } = useGetTodoListQuery(listId)

    const { task } = useGetTodoListQuery(listId, {
        selectFromResult: ({ data }) => ({
            task: data?.todos?.find(t => t.id === taskId),
        }),
    });

    const [assignedTo, setAssignedTo] = useState<string | null>(
        String(task?.assignedToId)
    );
    const [dateValue, setDateValue] = useState<string | Date | undefined | null>(task?.dueDate);
    const [taskNote, setTaskNote] = useState<string>(task?.notes ?? "");

    if (!task) return null;

    const handleUpdateTitle = async (next: string) => {
        if (!task) return;
        await updateTodoTitle({ todoId: task.id, title: next, listId: task.listId, householdId: householdId }).unwrap();
    }


    let taskDate = new Date(task.createdAt);
    const options = { weekday: 'short', month: 'short', day: 'numeric' } as const;

    useEffect(() => {
        setDateValue(task?.dueDate ?? null);
    }, [task?.dueDate]);

    useEffect(() => {
        setAssignedTo(task?.assignedToId != null ? String(task.assignedToId) : null);
    }, [task?.assignedToId]);

    useEffect(() => {
        setTaskNote(task?.notes ?? "");
    }, [task?.notes]);

    const handleDateInputPick = async (val: string | Date | null | undefined) => {
        const dueDate: string | null =
            val == null ? null : typeof val === "string" ? val.slice(0, 10) : dayjs(val).format("YYYY-MM-DD");

        setDateValue(dueDate);
        await updateTodo({ todoId: task.id, listId: task.listId, householdId, dueDate }).unwrap();
    };

    const handleUpdateAssignedTo = async (val: string | null) => {
        setAssignedTo(val);
        await updateTodo({
            todoId: task.id,
            listId: task.listId,
            householdId,
            assignedToId: val ? Number(val) : null, // allow clearing
        }).unwrap();
    };

    const handleSaveNotes = async (next: string) => {
        setTaskNote(next); // update local UI immediately
        await updateTodo({
            todoId: task.id,
            listId: task.listId,
            householdId,
            notes: next,                // <-- use 'next', not state
        }).unwrap();
    };

    const membersList =
        household?.members
            ?.filter((m) => todoList?.memberIds?.includes(m.id))
            .map((m) => ({ id: m.id, name: m.name, profileImg: m.profileImg }))
        ?? [];

    const data = membersList.map((m) => ({
        value: String(m.id),
        label: m.name,
        profileImg: m.profileImg, // keep raw data for renderOption
    }));

    const selected = data.find((d) => d.value === assignedTo) || null;

    return <Drawer transitionProps={{ duration: 200, transition: 'fade-down' }} opened={opened} position="right" onClose={close}>
        <div className="task-details">
            <div>
                <p className="task-details-label">Task:</p>
                <div className="task-details-section">
                    <EditableTitle key={`${task?.id}-${task?.title}`} title={task.title} onSave={handleUpdateTitle} className="task-details-title editable-title" allowEmpty={false} />
                </div>
                <p className="task-details-label">Due Date:</p>
                <DatePickerInput
                    value={dateValue}
                    placeholder="Add due date"
                    leftSection={<CalendarMonthRoundedIcon />}
                    leftSectionWidth="40px"
                    styles={{
                        wrapper: { width: "100%", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                        input: { fontWeight: "normal", fontFamily: "Nunito Sans, sans-serif", border: 0, width: "100%", paddingLeft: "2.5rem", borderRadius: "0.5rem", background: "var(--main-background)", color: "white" },

                        month: { background: "var(--main-background)", color: "white" },
                        day: { color: "white" },
                        calendarHeader: { background: "var(--main-background)", color: "white" },
                        presetsList: { background: "var(--main-background)", color: "white", borderColor: "var(--main-border)" },
                        datePickerRoot: { background: "var(--main-background)", borderRadius: "0.5rem" },
                        monthsListControl: { background: "var(--main-background)", color: "white" },
                        yearsListControl: { background: "var(--main-background)", color: "white" },
                        weekday: { color: "var(--sub-text)" },
                        placeholder: { color: "var(--sub-text)" }
                    }}
                    clearable
                    color="cyan"
                    presets={[
                        { value: dayjs().format('YYYY-MM-DD HH:mm:ss'), label: 'Today' },
                        { value: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'), label: 'Tomorrow' },
                        { value: dayjs().add(1, "week").format("YYYY-MM-DD HH:mm:ss"), label: "Next week" },
                        { value: dayjs().add(1, 'month').format('YYYY-MM-DD HH:mm:ss'), label: 'Next month' },
                    ]}
                    valueFormatter={({ date, format }: any) =>
                        date ? `Due ${dayjs(date).format(format)}` : ""
                    }
                    firstDayOfWeek={0}
                    onChange={handleDateInputPick}
                />
                <p className="task-details-label">Assigned To:</p>
                <Select
                    value={assignedTo}                      // string | null
                    onChange={handleUpdateAssignedTo}       // (val: string | null) => void
                    data={data}
                    clearable
                    placeholder="Assign to"

                    // Avatar in the INPUT when selected:
                    leftSection={
                        selected ? <Avatar src={selected.profileImg} radius="xl" size="xs" /> : <PersonAddAltRoundedIcon />
                    }
                    leftSectionWidth="40px"
                    // Avatar in EACH OPTION row:
                    renderOption={({ option }: any) => (
                        <Group gap="sm" wrap="nowrap">
                            <Avatar src={option.profileImg} radius="xl" size="xs" />
                            <span>{option.label}</span>
                        </Group>
                    )}

                    nothingFoundMessage="No members"
                    styles={{
                        wrapper: { width: "100%", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                        input: {
                            fontFamily: "Nunito Sans, sans-serif",
                            borderRadius: "0.5rem",
                            border: 0,
                            width: "100%",
                            paddingLeft: "2.5rem",
                            paddingTop: "1rem",
                            paddingBottom: "1rem",
                            background: "var(--main-background)",
                            color: "white"
                        },
                        section: { background: "transparent" },
                        dropdown: { background: "var(--main-background)", border: "1px solid white", borderRadius: "0.5rem" },
                        options: { background: "var(--main-background)", color: "white" },
                    }}
                />
                <p className="task-details-label">Notes:</p>
                <div className="task-details-section">
                    <EditableTitle
                        key={`${task.id}-${task.notes ?? ""}`}
                        title={taskNote}
                        onSave={handleSaveNotes}
                        className="task-details-title editable-title"
                        allowEmpty={true}
                    />
                </div>
            </div>
            <div>
                <div className="task-details-footer">
                    Created on {taskDate.toLocaleDateString("en-US", options)}
                </div>
            </div>
        </div>
    </Drawer>
}