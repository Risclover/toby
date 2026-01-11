import { EditableTitle } from "@/component/EditableTitle";
import { useGetTodoListQuery, useUpdateTodoMutation } from "@/store/todoSlice";
import { Avatar, Button, Drawer, Group, Select, Textarea, TextInput } from "@mantine/core"
import { useEffect, useState, type ChangeEventHandler } from "react";
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { DatePickerInput } from '@mantine/dates';
import { useGetHouseholdQuery } from "@/store/householdSlice";
import dayjs from 'dayjs';
import { useTaskDetails } from "../../hooks/useTaskDetails";

type Member = {
    id: number;
    firstName: string;
    profileImg: string | null;
}

type Props = {
    opened: boolean;
    close: () => void;
    taskId: number;
    listId: number;
    householdId?: number;
};

export const TaskDetails = ({ opened, close, taskId, listId, householdId }: Props) => {
    const {
        taskDetailsProps,
        taskError,
        data,
        selected,
        handleSaveTaskDetails,
        taskDate,
        options
    } = useTaskDetails({ taskId, listId, householdId: householdId!, close });

    return (
        <Drawer
            title="Task Details"
            transitionProps={{ duration: 200, transition: 'fade-down' }}
            opened={opened}
            position="right"
            onClose={close}
            styles={{
                root: {
                    height: "100%",
                },
                body: {
                    height: "calc(100% - 60px)",
                    padding: "0",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    overflow: "hidden"
                },
            }}
        >
            <div className="task-details">
                <div>
                    <p className="task-details-label">Task:</p>
                    <Textarea
                        minRows={1}
                        maxRows={20}
                        autosize
                        value={taskDetailsProps.title.value}
                        onChange={taskDetailsProps.title.onChange}
                    />
                    {taskError && <div className="error-message">{taskError}</div>}

                    <p className="task-details-label">Due Date:</p>
                    <DatePickerInput
                        value={taskDetailsProps.dueDate.value}
                        placeholder="Add due date"
                        leftSection={<CalendarMonthRoundedIcon />}
                        leftSectionWidth="40px"
                        styles={{
                            section: { color: "var(--accent-color)" }
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
                        onChange={taskDetailsProps.dueDate.onChange}
                        className="tasklist-date-picker"
                    />
                    <p className="task-details-label">Assigned To:</p>
                    <Select
                        value={taskDetailsProps.assigned.value}                      // string | null
                        onChange={taskDetailsProps.assigned.onChange}       // (val: string | null) => void
                        data={data}
                        clearable
                        placeholder="Assign to member"
                        styles={{
                            section: { color: "var(--accent-color)" }
                        }}
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
                    />
                    <p className="task-details-label">Notes:</p>

                    <Textarea
                        value={taskDetailsProps.notes.value}
                        onChange={taskDetailsProps.notes.onChange}
                        placeholder="Add task notes"
                        minRows={3}
                        maxRows={35}
                        autosize
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" color="cyan" onClick={() => close()}>Cancel</Button>
                        <Button variant="filled" color="cyan" onClick={handleSaveTaskDetails}>Save</Button>
                    </Group>
                </div>
            </div>
            <div className="task-details-footer">
                Created on {taskDate.toLocaleDateString("en-US", options)}
            </div>
        </Drawer>
    )
}