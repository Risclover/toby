import { FormColorInput } from "@/components/FormColorInput";
import { useCreateNoteCategoryMutation, useGetCategoriesQuery, type PersonalNoteCategory } from "@/store/noteCategorySlice";
import { Button, Group, Modal, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import "../styles/PersonalNoteCategories.css"
import { isTooLight } from "@/utils";
import { useCreateNoteForm } from "@/features/PersonalNotes/hooks/useCreateNoteForm";
import { RemainingChars } from "@/components/RemainingChars";

interface CreateCategoryForm {
    name: string;
    color?: string;
}

type Props = {
    opened: boolean;
    close: () => void;
    onCategoryCreated: (category: PersonalNoteCategory) => void; // add this

}
export const CreateNoteCategory = ({ opened, close, onCategoryCreated }: Props) => {
    const [createCategory] = useCreateNoteCategoryMutation();
    const { data: categories } = useGetCategoriesQuery();
    console.log('CATEGORIES:', categories)

    const form = useForm<CreateCategoryForm>({
        initialValues: {
            name: "",
            color: ""
        },
        validate: {
            name: (value) => value.trim().length === 0 && "Name required",
            color: (value) =>
                !value || value.trim().length === 0 ? "Color required" :
                    isTooLight(value) ? "This color is too light. Please choose something darker." :
                        null,
        }
    })

    const handleClose = () => {
        form.reset();
        close();
    }

    const handleSubmit = form.onSubmit(async () => {
        const data = await createCategory({
            name: form.values.name,
            color: form.values.color || ""
        }).unwrap();

        onCategoryCreated(data); // use the prop
        form.reset();
        close();
    })

    const hasColorError = isTooLight(form.values.color);

    if (!categories) return null;

    return (
        <Modal opened={opened} onClose={handleClose} title="Create notes category" radius="md" size="sm" centered>
            <form className="create-notes-category-form" onSubmit={handleSubmit}>
                <TextInput
                    label="Name"
                    required
                    radius="md"
                    maxLength={20}
                    {...form.getInputProps("name")}
                />
                <RemainingChars count={form.values.name.trim().length} max={20} />
                <FormColorInput label="Color" form={form} required />
                <div className="form-input-error" style={{ height: "16px" }}>{hasColorError ? "This color is too light. Please choose something darker." : null}</div>

                <div className="create-notes-category-form--footer">
                    <Group justify="flex-end" mt="xs">
                        <Button h="auto" p=".5rem 1rem" size="sm" fw={500} color="rgb(5, 5, 73)" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button disabled={!form.isDirty() || !form.isValid()} type="submit" h="auto" p=".5rem 1rem" size="sm" fw={500} color="rgb(5, 5, 73)">
                            Save
                        </Button>
                    </Group>
                </div>
            </form>
        </Modal>
    )
}