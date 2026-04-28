import { FormColorInput } from "@/components/FormColorInput";
import { useCreateNoteCategoryMutation, useUpdateCategoryMutation, useGetCategoriesQuery, type PersonalNoteCategory } from "@/store/noteCategorySlice";
import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import "../styles/PersonalNoteCategories.css";
import { isTooLight } from "@/utils";
import { RemainingChars } from "@/components/RemainingChars";
import { useEffect } from "react";

type Props = {
    opened?: boolean;
    close?: () => void;
    onCategoryCreated?: (category: PersonalNoteCategory) => void;
    stack?: any;
    category?: PersonalNoteCategory | null; // edit mode when present
}

export const CreateNoteCategory = ({ opened, close, onCategoryCreated, stack, category }: Props) => {
    const [createCategory] = useCreateNoteCategoryMutation();
    const [updateCategory] = useUpdateCategoryMutation();
    const isEditing = !!category;

    const form = useForm({
        initialValues: { name: "", color: "" },
        validate: {
            name: (value) => value.trim().length === 0 ? "Name required" : null,
            color: (value) =>
                !value || value.trim().length === 0 ? "Color required" :
                    isTooLight(value) ? "This color is too light. Please choose something darker." :
                        null,
        }
    });

    useEffect(() => {
        if (category) {
            form.setValues({ name: category.name, color: category.color ?? "" });
        } else {
            form.reset();
        }
    }, [category]);

    const handleClose = () => {
        form.reset();
        close?.();
    };

    const handleSubmit = form.onSubmit(async () => {
        if (isEditing) {
            await updateCategory({
                id: category.id,
                name: form.values.name,
                color: form.values.color,
            }).unwrap();
        } else {
            const data = await createCategory({
                name: form.values.name,
                color: form.values.color || ""
            }).unwrap();
            onCategoryCreated?.(data);
        }
        form.reset();
        close?.();
    });

    const hasColorError = isTooLight(form.values.color);

    return (
        <Modal
            opened={opened ?? false}
            {...stack?.register("edit")}
            onClose={handleClose}
            title={isEditing ? "Edit category" : "Create notes category"}
            radius="md"
            size="sm"
            centered
        >
            <form className="create-notes-category-form" onSubmit={(e) => { e.stopPropagation(); handleSubmit(e); }}
            >
                <TextInput
                    label="Name"
                    required
                    radius="md"
                    maxLength={20}
                    {...form.getInputProps("name")}
                />
                <RemainingChars count={form.values.name.trim().length} max={20} />
                <FormColorInput label="Color" form={form} required />
                <div className="form-input-error" style={{ height: "16px", marginTop: "4px" }}>
                    {hasColorError ? "This color is too light. Please choose something darker." : null}
                </div>
                <div className="create-notes-category-form--footer">
                    <Group justify="flex-end" mt="md">
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
    );
};