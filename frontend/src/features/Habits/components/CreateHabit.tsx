import { Button, Modal, Stack, Switch, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import { FormColorInput } from "@/components/FormColorInput";
import { useCreateHabitMutation } from "@/store";
import { SettingsItem } from "@/features/HouseholdTasklists";
import { isTooLight } from "@/utils";

interface HabitFormValues {
    name: string;
    description: string;
    color: string;
    isPrivate: boolean;
}

export const CreateHabit = ({ opened, close }: { opened: boolean; close: () => void; }) => {
    const [createHabit] = useCreateHabitMutation();

    const form = useForm<HabitFormValues>({
        initialValues: {
            name: "",
            description: "",
            color: "#050549",
            isPrivate: false
        },
        validate: {
            name: (value) => value.trim().length === 0 ? "Please give your habit a name." : null,
            color: (value) => (value.trim().length === 0 ? "Please choose a color to represent your habit." : null) || (isTooLight(value) ? "This color is too light. Please choose a darker color." : null)
        }
    })

    const closeModal = () => {
        if (form.isDirty()) {
            form.reset();
        }

        close();
    }

    const handleHabitCreation = async () => {
        const { hasErrors } = form.validate();
        if (hasErrors) return;

        const payload = {
            name: form.values.name,
            description: form.values.description,
            color: form.values.color,
            isPrivate: form.values.isPrivate,
        };

        try {
            await createHabit(payload).unwrap();
            form.reset();
            close();
        } catch (err) {
            console.error("Failed to create habit:", err);
        }
    };

    return (
        <Modal size="lg" radius="md" opened={opened} onClose={closeModal} title="Create Habit">
            <Stack component="form" onSubmit={handleHabitCreation}>
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
                <FormColorInput form={form} label="Color" />
                <SettingsItem divider={false} layout="row" label="Make private" description="Hide from other household members.">
                    <Switch
                        color="rgb(5, 5, 73)"
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('isPrivate', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <Button type="button" onClick={handleHabitCreation} color="rgb(5, 5, 73)" radius="xl">
                    Submit
                </Button>
            </Stack>
        </Modal>
    )
}
