import { Button, Group, Input, Modal, Stack, Switch, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import { FormColorInput } from "@/components/FormColorInput";
import { useCreateHabitMutation, useUpdateHabitMutation } from "@/store";
import { isTooLight } from "@/utils";
import { useHabitModal } from "@/contexts";
import { useEffect } from "react";
import { RemainingChars } from "@/components/RemainingChars";
import { useGetCurrentUserSettingsQuery } from "@/store/userSettingsSlice";
import { useModalFocus } from "@/hooks/useModalFocus";
import { KittyNotification } from "@/components/KittyNotification";
import { KittyIcons } from "@/assets";
import { useCloseModalOnNavigate } from "@/hooks/useCloseModalOnNavigate";

interface HabitFormValues {
    name: string;
    description?: string;
    color: string;
    isPrivate: boolean;
}

type Props = {
    onSuccess?: () => void;
}

export const HabitModal = ({ onSuccess }: Props) => {
    const { isOpen, habitData, closeModal } = useHabitModal();
    const [createHabit] = useCreateHabitMutation();
    const [updateHabit] = useUpdateHabitMutation();
    const { data: userSettings } = useGetCurrentUserSettingsQuery();
    const isEditing = habitData?.id !== undefined;
    const { ref: nameRef, transitionProps } = useModalFocus(!isEditing);
    useCloseModalOnNavigate(closeModal);

    const form = useForm<HabitFormValues>({
        initialValues: {
            name: "",
            description: "",
            color: "#050549",
            isPrivate: userSettings?.settings?.habitsPrivacyMode === "private_by_default"
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
            form.setValues({
                name: "",
                description: "",
                color: "#050549",
                isPrivate: userSettings?.settings?.habitsPrivacyMode === "private_by_default",
            });
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
                KittyNotification({
                    title: "Habit updated",
                    message: <>Looking good! Your changes to "<strong style={{ fontWeight: 500 }}>{form.values.name}</strong>" have been saved.</>,
                    color: "green",
                    icon: KittyIcons.Write
                })
            } else {
                await createHabit(form.values).unwrap();
                KittyNotification({
                    title: "Habit created",
                    message: <>Great choice! "<strong style={{ fontWeight: 500 }}>{form.values.name}</strong>" has been added to your habits.</>,
                    color: "green",
                    icon: KittyIcons.Workout
                })
                closeModal();
                onSuccess?.();
            }
            form.reset();
        } catch (err) {
            console.error("Failed to save habit:", err);
            KittyNotification({
                title: "Oopsies, something went wrong.",
                message: "You might want to try that again.",
                color: "red",
                icon: KittyIcons.Rain
            })
        }
    };
    return (
        <Modal
            transitionProps={transitionProps}
            centered
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
                content: { overflow: "hidden", maxHeight: "100%", display: "flex", flexDirection: "column" },
            }}
            size="md"
            radius="md"
            opened={isOpen}
            onClose={closeHabitModal}
            title={isEditing ? "Edit habit" : "Create habit"}  // <-- title switches here
        >
            <div className="user-settings-body">
                <Stack component="form" onSubmit={handleSubmit} gap={0}>
                    <div className="habit-form-item">
                        <TextInput
                            radius="sm"
                            label="Name"
                            required
                            placeholder="30-minute walk"
                            maxLength={50}
                            {...form.getInputProps("name")}
                            ref={nameRef}
                        />
                        <RemainingChars count={form.values.name.length} max={50} />
                    </div>
                    <div className="habit-form-item">
                        <Textarea
                            label="Description"
                            radius="sm"
                            placeholder="Morning or evening, walk at least once a day"
                            maxRows={4}
                            minRows={1}
                            autosize
                            maxLength={200}
                            key={form.key("description")}
                            {...form.getInputProps("description")}
                        />
                        <RemainingChars count={form.values.description ? form.values.description.length : 0} max={200} />
                    </div>
                    <div className="habit-form-item">
                        <FormColorInput form={form} label="Color" required />
                    </div>
                    <div className="habit-form-item row-item">
                        <div className="input-label-description">
                            <Input.Label>Make private</Input.Label>
                            <Input.Description>Hide from other household members.</Input.Description>
                        </div>
                        <Switch
                            color="rgb(5, 5, 73)"
                            size="md"
                            withThumbIndicator={false}
                            {...form.getInputProps('isPrivate', { type: 'checkbox' })}
                        />
                    </div>
                </Stack>
            </div>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="flex-end" w="100%">
                    <Button type="button" onClick={handleSubmit} disabled={form.values.color.trim().length === 0 || form.values.name.trim().length === 0} color="rgb(5, 5, 73)" radius="sm" fw={500}>
                        Submit
                    </Button>
                </Group>
            </Modal.Header>

        </Modal>
    )
}
