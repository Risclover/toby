import { Avatar, Button, Drawer, Group, Select, Textarea } from "@mantine/core"
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useTaskDetails } from "../../hooks/useTaskDetails";
import { TrashIcon } from "@/assets/icons/TrashIcon";
import { TaskDeletionConfirmation } from "./TaskDeletionConfirmation";
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

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
        taskDetailsProps,
        taskError,
        data,
        selected,
        handleSaveTaskDetails,
        handleConfirmTaskDeletion,
        showTaskDeletion,
        setShowTaskDeletion,
        getFooterText
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
                        minRows={2}
                        maxRows={20}
                        maxLength={255}
                        autosize
                        value={taskDetailsProps.title.value}
                        onChange={taskDetailsProps.title.onChange}
                        placeholder="Write task here"
                    />
                    {taskError && <div className="error-message">{taskError}</div>}

                    <p className="task-details-label">Due date:</p>
                    <DatePickerInput
                        value={taskDetailsProps.dueDate.value}
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
                            section: { color: "var(--tasklist-color)" }
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
                        <Button className="tasklist-settings-footer-btn" variant="outline" color="var(--tasklist-color)" onClick={() => close()}>Cancel</Button>
                        <Button className="tasklist-settings-footer-btn" variant="filled" color="var(--tasklist-color)" onClick={handleSaveTaskDetails}>Save</Button>
                    </Group>
                </div>
            </div>
            <div className="task-details-footer">
                <span className="task-details-date">{getFooterText()}</span>
                <Button variant="subtle" radius="xs" size="xs" color="var(--tasklist-color)" className="delete-task-btn" onClick={handleConfirmTaskDeletion}><TrashIcon /></Button>
            </div>
            {showTaskDeletion && <TaskDeletionConfirmation title={taskDetailsProps.title.value} opened={showTaskDeletion} onClose={() => setShowTaskDeletion(false)} listId={listId} taskId={taskId} />}
        </Drawer>
    )
}