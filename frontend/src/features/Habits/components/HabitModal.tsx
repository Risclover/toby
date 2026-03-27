import { Button, Group, Modal, Stack, Switch, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import { FormColorInput } from "@/components/FormColorInput";
import { useCreateHabitMutation, useUpdateHabitMutation } from "@/store";
import { SettingsItem } from "@/features/HouseholdTasklists";
import { isTooLight } from "@/utils";
import { useIsSmallScreen } from "@/hooks";
import { useHabitModal } from "@/contexts";
import { useEffect } from "react";

interface HabitFormValues {
    name: string;
    description?: string;
    color: string;
    isPrivate: boolean;
}

export const HabitModal = () => {
    const isSmallScreen = useIsSmallScreen();
    const { isOpen, habitData, closeModal } = useHabitModal();
    const [createHabit] = useCreateHabitMutation();
    const [updateHabit] = useUpdateHabitMutation();

    const isEditing = habitData?.id !== null;

    const form = useForm<HabitFormValues>({
        initialValues: {
            name: "",
            description: "",
            color: "#050549",
            isPrivate: false,
        },
        validate: {
            name: (value) => value.trim().length === 0 ? "Please give your habit a name." : null,
            color: (value) =>
                value.trim().length === 0 ? "Please choose a color." :
                    isTooLight(value) ? "This color is too light." : null,
        },
    });

    // Seed form when modal opens
    useEffect(() => {
        if (!isOpen) return;
        if (habitData?.id != null) {
            form.setValues({
                name: habitData.name ?? "",
                description: habitData.description ?? "",
                color: habitData.color ?? "#050549",
                isPrivate: habitData.isPrivate ?? false,
            });
        } else {
            form.reset();
        }
        form.resetDirty();
    }, [isOpen]);

    const closeHabitModal = () => {
        form.reset();
        closeModal();
    };

    const handleSubmit = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        try {
            if (isEditing) {
                closeModal();  // <-- close first
                await updateHabit({
                    habitId: habitData?.id!,
                    ...form.values,
                }).unwrap();
            } else {
                await createHabit(form.values).unwrap();
                closeModal();  // <-- create still waits, so the user sees the submit complete
            }
            form.reset();
        } catch (err) {
            console.error("Failed to save habit:", err);
        }
    };

    return (
        <Modal
            centered
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
                content: { overflow: "hidden", maxHeight: "100%", display: "flex", flexDirection: "column" },
            }}
            size="md"
            radius="md"
            opened={isOpen}
            onClose={closeHabitModal}
            title={isEditing ? "Edit Habit" : "Create Habit"}  // <-- title switches here
        >
            <div className="user-settings-body">
                <Stack component="form" onSubmit={handleSubmit}>
                    <TextInput
                        radius="sm"
                        required
                        label="Name"
                        placeholder="30-minute walk"
                        {...form.getInputProps("name")}
                    />
                    <Textarea
                        radius="sm"
                        label="Description"
                        placeholder="Morning or evening, walk at least once a day"
                        maxRows={4}
                        minRows={1}
                        autosize
                        maxLength={200}
                        key={form.key("description")}
                        {...form.getInputProps("description")}
                    />
                    <FormColorInput form={form} label="Color" required />
                    <SettingsItem divider={false} layout="row" label="Make private" description="Hide from other household members.">
                        <Switch
                            color="rgb(5, 5, 73)"
                            size="md"
                            withThumbIndicator={false}
                            {...form.getInputProps('isPrivate', { type: 'checkbox' })}
                        />
                    </SettingsItem>
                </Stack>
            </div>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="flex-end" w="100%">
                    <Button type="button" onClick={handleSubmit} color="rgb(5, 5, 73)" radius="xl">
                        Submit
                    </Button>
                </Group>
            </Modal.Header>

        </Modal>
    )
}
