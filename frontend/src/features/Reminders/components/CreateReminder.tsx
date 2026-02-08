import { HouseholdMemberSelection } from "@/components/HouseholdMemberSelection";
import { useMemberSelection } from "@/hooks";
import { useAuthenticateQuery, useGetHouseholdQuery, type User } from "@/store";
import { useCreateManualReminderMutation } from "@/store/reminderSlice";
import { Avatar, Button, Checkbox, Collapse, Group, Modal, Space, Stack, Textarea, TextInput } from "@mantine/core"
import { useState } from "react";

type Props = {
    setShowCreateReminder: (val: boolean) => void;
    members?: User[];
    allMembers: boolean;
    someSelected: boolean;
    selected: Set<number>;
    onToggleAll: (checked: boolean) => void;
    onToggleOne: (id: number) => void;
}

export const CreateReminder = ({ setShowCreateReminder }: Props) => {
    const [reminderBody, setReminderBody] = useState("");
    const [title, setTitle] = useState("");
    const [focused, setFocused] = useState(false);

    const floating = reminderBody.trim().length !== 0 || focused || undefined;

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const [createReminder] = useCreateManualReminderMutation();

    const handleCancelReminder = () => {
        setShowCreateReminder(false);
    }

    const {
        allMembers,
        someSelected,
        memberIds,
        toggleAll,
        toggleOne,
        selected,
    } = useMemberSelection(household?.members);

    console.log('reminderBody:', reminderBody);
    const handleCreateReminder = async () => {
        const payload = {
            assignedToIds: Array.from(selected),
            reminderBody: reminderBody.trim(),
            title: title.trim(),
            sourceEntityId: null,
            sourceEntityType: null,
            seen: false,
            triggerAt: null,
        }
        const data = await createReminder({
            householdId: household?.id, ...payload
        });
        console.log('data:', data);
        setShowCreateReminder(false);
    }
    return (
        <Modal centered radius="md" onClose={() => setShowCreateReminder(false)} title="Create reminder" opened={true}>
            <TextInput
                radius="sm"
                label="Title (optional)"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                maxLength={50}
            />
            <Textarea
                radius="sm"
                label="Body"
                placeholder="I bought eggs, don't forget to buy milk!"
                maxRows={10}
                minRows={5}
                mt="1rem"
                autosize
                value={reminderBody}
                onChange={(e) => setReminderBody(e.currentTarget.value)}
                maxLength={150}
            />
            <Space h="md" />
            <HouseholdMemberSelection
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
                    onClick={handleCancelReminder}
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                    styles={{ label: { fontWeight: "400" } }}
                >
                    Cancel
                </Button>
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    variant="light"
                    fw={400}
                    color="rgb(5, 5, 73)"
                    onClick={handleCreateReminder}
                >
                    Save
                </Button>
            </Group>
        </Modal >
    )
}