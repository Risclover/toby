import { useState } from "react";
import { useForm } from "@mantine/form";
import { useCreateNoteMutation } from "@/store/noteSlice";
import type { PersonalNoteCategory } from "@/store";
import { KittyNotification } from "@/components/KittyNotification";
import { KittyIcons } from "@/assets";

const MAX_BODY_LENGTH = 10000;

export const useCreateNoteForm = (onSuccess?: () => void) => {
    const [createPersonalNote] = useCreateNoteMutation();
    const [charCount, setCharCount] = useState(0);
    const [editorKey, setEditorKey] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<PersonalNoteCategory | null>(null);

    const form = useForm({
        initialValues: { title: "", body: "", isPrivate: false, categoryId: undefined as number | undefined },
        validate: {
            title: (value) => value.trim().length === 0 ? "Please give your note a title." : null,
            body: (value) => {
                const plain = value.replace(/<[^>]*>/g, "").trim();
                if (plain.length === 0) return "Please give your note some content.";
                if (plain.length > MAX_BODY_LENGTH)
                    return `Content must be ${MAX_BODY_LENGTH.toLocaleString()} characters or fewer.`;
                return null;
            },
        },
    });

    const handleSelectCategory = (category: PersonalNoteCategory | null) => {
        setSelectedCategory(category);
        form.setFieldValue("categoryId", category?.id ?? undefined);
    };

    const handleBodyChange = (html: string) => {
        form.setFieldValue("body", html);
        setCharCount(html.replace(/<[^>]*>/g, "").length);
    };

    const handleToggleVisibility = () => {
        form.setFieldValue("isPrivate", !form.values.isPrivate);
    };

    const handleSubmit = form.onSubmit(async (values) => {
        try {
            await createPersonalNote({
                title: values.title,
                body: values.body,
                isPrivate: values.isPrivate,
                isFavorite: false,
                categoryId: values.categoryId,
            }).unwrap();
            form.reset();
            setCharCount(0);
            setEditorKey(k => k + 1);
            setSelectedCategory(null);
            onSuccess();
            KittyNotification({
                title: "Note created successfully",
                message: <>You successfully posted a new note: "<strong style={{ fontWeight: 500 }}>{values.title}</strong>".</>,
                icon: KittyIcons.Write,
                color: "green"
            })
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: "Failed to create note. Try again.",
                icon: KittyIcons.Cry,
                color: "red"
            })

            console.error("Failed to create note:", error);
        }
    });

    const handleReset = () => {
        form.reset();
        setCharCount(0);
        setSelectedCategory(null);
    };

    return {
        form,
        charCount,
        editorKey,
        selectedCategory,
        handleSelectCategory,
        handleBodyChange,
        handleToggleVisibility,
        handleSubmit,
        handleReset,
        MAX_BODY_LENGTH,
    };
};