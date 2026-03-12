import { HouseholdMemberSelection } from "@/components/HouseholdMemberSelection";
import { useCreateReminderModal } from "@/contexts";
import { useIsSmallScreen, useMemberSelection } from "@/hooks";
import { useAuthenticateQuery, useGetHouseholdQuery } from "@/store";
import { useCreateManualReminderMutation } from "@/store/reminderSlice";
import { Button, Group, Modal, Select, Space, Textarea, Tooltip } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

interface ReminderFormValues {
    message: string;
    triggerDate: Date | null;
    repeat: "daily" | "weekly" | "monthly" | null;

}

const MAX_CHARS = 150;
const REPEAT_OPTIONS = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
];
const DATE_PRESETS = [
    { value: dayjs().format("YYYY-MM-DD HH:mm:ss"), label: "Today" },
    { value: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"), label: "Tomorrow" },
    { value: dayjs().add(1, "week").format("YYYY-MM-DD HH:mm:ss"), label: "Next week" },
    { value: dayjs().add(1, "month").format("YYYY-MM-DD HH:mm:ss"), label: "Next month" },
];
const DATE_PICKER_STYLES = {
    section: { color: "rgb(5, 5, 73)" },
    day: {
        "&[data-weekend]": { color: "#4e0202" },
        "&[data-selected], &[data-selected]:hover": {
            backgroundColor: "#2563eb",
            color: "white",
        },
    },
};

export const CreateReminder = () => {
    const { closeCreateReminderModal, isOpen } = useCreateReminderModal();
    const isSmallScreen = useIsSmallScreen();

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const [createReminder] = useCreateManualReminderMutation();

    const {
        allMembers,
        someSelected,
        memberIds,
        selected,
        toggleAll,
        toggleOne,
        reset
    } = useMemberSelection(household?.members);

    const form = useForm<ReminderFormValues>({
        initialValues: {
            message: "",
            triggerDate: null,
            repeat: null,
        },
        validate: {
            message: (value) =>
                value.trim().length === 0 ? "Please type your reminder here." : null,
        },
    });

    const remainingChars = MAX_CHARS - form.values.message.trim().length;
    const atLimit = remainingChars === 0;

    const handleClose = () => {
        form.reset();
        closeCreateReminderModal();
        reset();
    };

    const handleSubmit = async (values: ReminderFormValues) => {
        await createReminder({
            householdId: household?.id,
            assignedToIds: memberIds,
            message: values.message.trim(),
            triggerDate: values.triggerDate ?? null,
            repeat: values.repeat ?? null,
            sourceEntityId: null,
            sourceEntityType: null,
            seen: false,
        });
        form.reset();
        closeCreateReminderModal();
    };

    return (
        <Modal centered radius="md" onClose={handleClose} title="Create reminder" opened={isOpen}>
            {/* form.onSubmit runs validation before calling handleSubmit */}
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Textarea
                    radius="sm"
                    required
                    label="Body"
                    placeholder="Ex: Buy eggs tomorrow for the cake"
                    maxRows={4}
                    minRows={1}
                    autosize
                    maxLength={MAX_CHARS}
                    key={form.key("message")}
                    {...form.getInputProps("message")}
                />
                <div className="create-reminder-chars">
                    <span className={`create-announcement-remaining${atLimit ? " remaining-none" : ""}`}>
                        {remainingChars}
                    </span>
                    /{MAX_CHARS}
                </div>


                <div className="two-column-inputs">
                    <div className="two-column-input">
                        <DatePickerInput
                            label={
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    Trigger date (optional)
                                    <Tooltip
                                        events={{ hover: true, focus: true, touch: true }}
                                        multiline
                                        w={220}
                                        radius="md"
                                        withArrow
                                        transitionProps={{ duration: 200 }}
                                        label="Reminders with no trigger date appear right away. Reminders with a trigger date appear at midnight on the selected day."
                                    >
                                        <Button
                                            p={0}
                                            h="auto"
                                            radius="xl"
                                            color="transparent"
                                            variant="transparent"
                                            className="featured-info-icon"
                                        >
                                            <HelpOutlineRoundedIcon />
                                        </Button>
                                    </Tooltip>
                                </span>
                            }
                            dropdownType={isSmallScreen ? "modal" : "popover"}
                            placeholder="Add trigger date"
                            leftSection={<CalendarMonthRoundedIcon />}
                            leftSectionWidth="40px"
                            styles={DATE_PICKER_STYLES}
                            clearable
                            color="rgb(5, 5, 73)"
                            presets={DATE_PRESETS}
                            valueFormatter={({ date, format }: any) =>
                                date ? dayjs(date).format(format) : ""
                            }
                            firstDayOfWeek={0}
                            className="reminder-date-picker"
                            {...form.getInputProps("triggerDate")}
                            key={form.key("triggerDate")}
                        />
                    </div>

                    {form.values.triggerDate && <div className="two-column-input">
                        <Select
                            label="Repeat (optional)"
                            placeholder="Choose frequency"
                            data={REPEAT_OPTIONS}
                            clearable
                            leftSection={<EventRepeatRoundedIcon />}
                            leftSectionWidth="40px"
                            styles={{ section: { color: "rgb(5, 5, 73)" } }}
                            key={form.key("repeat")}
                            {...form.getInputProps("repeat")}
                        />
                    </div>}
                </div>

                <Space h="md" />

                <HouseholdMemberSelection
                    required
                    title="Who is this reminder for?"
                    members={household?.members}
                    allMembers={allMembers}
                    someSelected={someSelected}
                    selected={selected}
                    onToggleAll={toggleAll}
                    onToggleOne={toggleOne}
                />

                <Space h="md" />

                <Group justify="flex-end">
                    <Button
                        onClick={handleClose}
                        className="tasklist-settings-footer-btn"
                        size="compact-sm"
                        color="var(--mantine-color-dark-6)"
                        variant="outline"
                        fw={500}
                    >
                        Cancel
                    </Button>
                    {/* type="submit" triggers form.onSubmit — no onClick needed */}
                    <Button
                        type="submit"
                        className="tasklist-settings-footer-btn"
                        size="compact-sm"
                        variant="light"
                        color="rgb(5, 5, 73)"
                        disabled={form.values.message.trim().length === 0 || memberIds.length === 0}
                        fw={500}
                    >
                        Save
                    </Button>
                </Group>
            </form>
        </Modal>
    );
};