import { useEffect } from "react";
import { useForm } from "@mantine/form";

import { KittyNotification } from "@/components";
import { useCloseModalOnNavigate } from "@/hooks";
import { useCreateNoteCategoryMutation, useUpdateCategoryMutation, type PersonalNoteCategory } from "@/store";
import { isTooLight } from "@/utils";

import { KittyIcons } from "@/assets";


type UseCreateNoteCategoryProps = {
    /** Callback for closing the modal */
    close: () => void;
    /** Called with newly-created category after successful creation (not used in Edit mode) */
    onCategoryCreated?: (category: PersonalNoteCategory) => void;
    /** When provided, form is prefilled with this category's values ('edit' mode). */
    category?: PersonalNoteCategory | null;
}

/** 
 * Custom hook that provides functionality for create/edit note category form/modal
 */
export const useCreateNoteCategory = ({ close, category, onCategoryCreated }: UseCreateNoteCategoryProps) => {
    const [createCategory] = useCreateNoteCategoryMutation();
    const [updateCategory] = useUpdateCategoryMutation();
    useCloseModalOnNavigate(close);

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

    /** True when a `category` prop is present — drives which mutation fires on submit. */
    const isEditing = !!category;

    /** For instances of very light colors (prevents terrible design & accessibility outcomes) */
    const hasColorError = isTooLight(form.values.color);

    /** Pre-fill form values when entering edit mode. Resets when switching back to create mode. */
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

    const updateNote = async () => {
        if (!category) return;

        await updateCategory({
            id: category.id,
            name: form.values.name,
            color: form.values.color,
        }).unwrap();

        KittyNotification({
            title: "Category updated",
            message:
                <>
                    You've successfully given category "
                    <strong style={{ fontWeight: 500 }}>
                        {form.values.name}
                    </strong>
                    " a new look!
                </>,
            icon: KittyIcons.Dance,
            color: "green"
        });
    }

    const createNote = async () => {
        const data = await createCategory({
            name: form.values.name,
            color: form.values.color || ""
        }).unwrap();

        KittyNotification({
            title: "Category created",
            message:
                <>
                    Category "
                    <strong style={{ fontWeight: 500 }}>
                        {form.values.name}
                    </strong>
                    " has been created!
                </>,
            icon: KittyIcons.Dance,
            color: "green"
        });

        onCategoryCreated?.(data);
    }

    const handleSubmit = form.onSubmit(async () => {
        try {
            if (isEditing) {
                await updateNote();
            } else {
                await createNote();
            }
            form.reset();
            close?.();
        } catch (error) {
            KittyNotification({
                title: "It didn't work!",
                message:
                    <>
                        Couldn't {isEditing ? "update" : "create"} category "
                        <strong style={{ fontWeight: 500 }}>
                            {form.values.name}
                        </strong>
                        ". Try again.
                    </>,
                color: "red",
                icon: KittyIcons.Confused
            });
            console.error("Failed to create or edit note category:", error);
        }
    });

    return {
        form,
        handleClose,
        handleSubmit,
        isEditing,
        hasColorError
    }
}