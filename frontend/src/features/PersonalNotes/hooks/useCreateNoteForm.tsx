import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { useCreateNoteMutation, useUpdateNoteMutation } from "@/store/noteSlice";
import { useAuthenticateQuery, useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { KittyNotification } from "@/components/KittyNotification";
import { KittyIcons } from "@/assets";
import { useGetUserSettingsQuery } from "@/store/userSettingsSlice";
import { usePersonalNoteModal } from "@/contexts/PersonalNoteModalContext";

const MAX_BODY_LENGTH = 10000;

export const useCreateNoteForm = (onSuccess: () => void) => {
    const [createPersonalNote] = useCreateNoteMutation();
    const [updatePersonalNote] = useUpdateNoteMutation();
    const [charCount, setCharCount] = useState(0);
    const [editorKey, setEditorKey] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<PersonalNoteCategory | null>(null);
    const { data: currentUser } = useAuthenticateQuery();
    const { data: userSettings } = useGetUserSettingsQuery(currentUser?.id);
    const { isOpen, personalNoteData } = usePersonalNoteModal();
    const { data: categories } = useGetCategoriesQuery();

    const isEditing = personalNoteData?.id !== undefined;

    const form = useForm({
        initialValues: { title: "", body: "", isPrivate: userSettings?.settings.notesPrivacyMode === "private_by_default", categoryId: undefined as number | undefined },
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
            if (isEditing) {
                await updatePersonalNote({
                    id: personalNoteData?.id!,
                    ...form.values
                }).unwrap();
                KittyNotification({
                    title: "Note updated",
                    message: <>Looking good! Your changes to "<strong style={{ fontWeight: 500 }}>{form.values.title}</strong>" have been saved.</>,
                    color: "green",
                    icon: KittyIcons.Write
                })
                form.reset();
                setCharCount(0);
                setEditorKey(k => k + 1);
                onSuccess();
            } else {
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
                    icon: KittyIcons.Computer,
                    color: "green"
                })
            }
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: `Failed to ${isEditing ? "create" : "edit"} note. Try again.`,
                icon: KittyIcons.Cry,
                color: "red"
            })

            console.error("Failed to create or edit note:", error);
        }
    });

    const handleReset = () => {
        form.reset();
        setCharCount(0);
        setSelectedCategory(null);
    };

    useEffect(() => {
        if (!isOpen) return;

        if (personalNoteData?.id !== null && personalNoteData?.id !== undefined) {
            form.setValues({
                title: personalNoteData.title ?? "",
                body: personalNoteData.body ?? "",
                categoryId: personalNoteData.categoryId ?? undefined,
                isPrivate: personalNoteData.isPrivate ?? false,
            });
            setSelectedCategory(categories?.find(c => c.id === personalNoteData.categoryId) ?? null);
        } else {
            form.setValues({
                title: "",
                body: "",
                categoryId: undefined,
                isPrivate: userSettings?.settings?.notesPrivacyMode === "private_by_default",
            });
            setSelectedCategory(null);  // ← and this
        }
    }, [isOpen]);

    useEffect(() => {
        if (!selectedCategory || !categories) return;
        const stillExists = categories.some(c => c.id === selectedCategory.id);
        if (!stillExists) {
            setSelectedCategory(null);
            form.setFieldValue("categoryId", undefined);
        }
    }, [categories]);

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
        isEditing
    };
};