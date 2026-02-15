import { Avatar, Button, Drawer, Group, Select, Textarea } from "@mantine/core"
import { DatePickerInput } from '@mantine/dates';

import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';

import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

import { useTaskDetails } from "../../hooks/useTaskDetails";
import { TaskDeletionConfirmation } from "./TaskDeletionConfirmation";
import { TrashIcon } from "@/assets/icons/TrashIcon";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

type Props = {
    opened: boolean;
    close: () => void;
    taskId: number;
    listId: number;
    householdId?: number;
};

export const TaskDetails = ({ opened, close, taskId, listId, householdId }: Props) => {
    const {
        form,
        taskError,
        data,
        selected,
        handleSaveTaskDetails,
        handleConfirmTaskDeletion,
        showTaskDeletion,
        setShowTaskDeletion,
        getFooterText,
        isSubmitting,
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
                        id="title"
                        minRows={2}
                        maxRows={20}
                        maxLength={255}
                        autosize
                        placeholder="Write task here"
                        {...form.getInputProps("title")}
                    />
                    {taskError && <div className="error-message">{taskError}</div>}

                    <p className="task-details-label">Due date:</p>
                    <DatePickerInput
                        placeholder="Add due date"
                        leftSection={<CalendarMonthRoundedIcon />}
                        leftSectionWidth="40px"
                        styles={{
                            section: { color: "var(--tasklist-color)" }
                        }}
                        clearable
                        color="var(--tasklist-color)"
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
                        className="tasklist-date-picker"
                        {...form.getInputProps("dueDate")}
                    />
                    <p className="task-details-label">Assigned To:</p>
                    <Select
                        data={data}
                        clearable
                        placeholder="Assign to member"
                        value={form.values.assignedToId == null ? null : String(form.values.assignedToId)}
                        onChange={(val) => form.setFieldValue("assignedToId", val ? Number(val) : null)}
                        renderOption={({ option }: any) => (
                            <Group gap="sm" wrap="nowrap" align="center">
                                <Avatar src={option.profileImg} radius="xl" size="1.25rem" />
                                <span>{option.label}</span>
                            </Group>
                        )}
                        leftSection={
                            selected ? (
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <Avatar src={selected.profileImg} radius="xl" size="1.25rem" />
                                </div>
                            ) : (
                                <PersonAddAltRoundedIcon />
                            )
                        }
                    />
                    <p className="task-details-label">Notes:</p>

                    <Textarea
                        placeholder="Add task notes"
                        minRows={3}
                        maxRows={35}
                        autosize
                        {...form.getInputProps("notes")}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button
                            className="tasklist-settings-footer-btn"
                            variant="outline"
                            color="var(--tasklist-color)"
                            onClick={() => form.reset()}
                            disabled={!form.isDirty() || !form.isValid()}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="tasklist-settings-footer-btn"
                            variant="filled"
                            color="var(--tasklist-color)"
                            onClick={handleSaveTaskDetails}
                            loading={isSubmitting}
                            loaderProps={{ children: 'Saving...' }}
                            disabled={!form.isDirty() || !form.isValid()}
                        >
                            Update
                        </Button>
                    </Group>
                </div>
            </div>
            <div className="task-details-footer">
                <span className="task-details-date">{getFooterText()}</span>
                <Button
                    variant="subtle"
                    radius="xs"
                    size="xs"
                    color="var(--tasklist-color)"
                    className="delete-task-btn"
                    onClick={handleConfirmTaskDeletion}
                >
                    <TrashIcon />
                </Button>
            </div>
            {
                showTaskDeletion &&
                <TaskDeletionConfirmation
                    title={form.values.title}
                    opened={showTaskDeletion}
                    onClose={() => setShowTaskDeletion(false)}
                    listId={listId}
                    taskId={taskId}
                />
            }
        </Drawer >
    )
}