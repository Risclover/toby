import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";

import { KittyNotification } from "@/components";
import { usePersonalNoteModal } from "@/contexts";
import {
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useGetUserSettingsQuery,
    useAuthenticateQuery,
    useGetCategoriesQuery,
    type PersonalNoteCategory
} from "@/store";

import { KittyIcons } from "@/assets";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NoteFormValues {
    title: string;
    body: string;
    isPrivate: boolean;
    categoryId: number | undefined;
}

type UseCreateNoteFormProps = {
    setShowDiscardWarning: (val: boolean) => void;
    closeModal: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BODY_LENGTH = 10000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Hook for managing the state and logic of the create/edit note form */
export const useCreateNoteForm = ({ setShowDiscardWarning, closeModal }: UseCreateNoteFormProps) => {
    const [createPersonalNote] = useCreateNoteMutation();
    const [updatePersonalNote] = useUpdateNoteMutation();

    const { data: currentUser } = useAuthenticateQuery();
    const { data: userSettings } = useGetUserSettingsQuery(currentUser?.id);
    const { data: categories } = useGetCategoriesQuery();
    const { isOpen, personalNoteData } = usePersonalNoteModal();

    // ── State ─────────────────────────────────────────────────────────────────────

    const [charCount, setCharCount] = useState(0);
    const [editorKey, setEditorKey] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<PersonalNoteCategory | null>(null);

    const isEditing = personalNoteData?.id !== undefined;
    const defaultPrivacy = userSettings?.settings?.notesPrivacyMode === "private_by_default";

    const form = useForm<NoteFormValues>({
        initialValues: {
            title: "",
            body: "",
            isPrivate: defaultPrivacy,
            categoryId: undefined,
        },
        validate: {
            title: (value) =>
                value.trim().length === 0 ? "Please give your note a title." : null,
            body: (value) => {
                const plain = value.replace(/<[^>]*>/g, "").trim();
                if (plain.length === 0) return "Please give your note some content.";
                if (plain.length > MAX_BODY_LENGTH)
                    return `Content must be ${MAX_BODY_LENGTH.toLocaleString()} characters or fewer.`;
                return null;
            },
        },
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    const resetForm = () => {
        form.reset();
        setCharCount(0);
        setEditorKey(k => k + 1);
        setSelectedCategory(null);
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

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

    const handleClose = () => {
        if (form.isDirty()) {
            setShowDiscardWarning(true);
        } else {
            closeModal();
            resetForm();
        }
    };

    const handleDiscard = () => {
        setShowDiscardWarning(false);
        closeModal();
        resetForm();
    };

    const handleSubmit = form.onSubmit(async (values) => {
        try {
            if (isEditing) {
                await updatePersonalNote({ id: personalNoteData!.id, ...values }).unwrap();
                KittyNotification({
                    title: "Note updated",
                    message: <>Looking good! Your changes to "<strong style={{ fontWeight: 500 }}>{values.title}</strong>" have been saved.</>,
                    color: "green",
                    icon: KittyIcons.Write,
                });
            } else {
                await createPersonalNote({
                    ...values,
                    isFavorite: false,
                }).unwrap();
                KittyNotification({
                    title: "Note created successfully",
                    message: <>You successfully posted a new note: "<strong style={{ fontWeight: 500 }}>{values.title}</strong>".</>,
                    icon: KittyIcons.Computer,
                    color: "green",
                });
            }
            resetForm();
            closeModal();
        } catch (error) {
            KittyNotification({
                title: "Whoops - something went wrong",
                message: <>I didn't feel like {isEditing ? "editing" : "creating"} your note "<strong style={{ fontWeight: 500 }}>{values.title}</strong>". You'll have to try again.</>,
                icon: KittyIcons.Grumpy,
                color: "red",
            });
            console.error("Failed to create or edit note:", error);
        }
    });

    // ── Effects ───────────────────────────────────────────────────────────────

    // Populate form when modal opens for editing; reset to defaults when opening for creation.
    // Intentionally keyed only to isOpen; we want a snapshot of modal state at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!isOpen) return;

        if (isEditing) {
            form.setValues({
                title: personalNoteData.title ?? "",
                body: personalNoteData.body ?? "",
                categoryId: personalNoteData.categoryId ?? undefined,
                isPrivate: personalNoteData.isPrivate ?? false,
            });
            setSelectedCategory(categories?.find(c => c.id === personalNoteData.categoryId) ?? null);
        } else {
            form.setValues({ title: "", body: "", categoryId: undefined, isPrivate: defaultPrivacy });
            setSelectedCategory(null);
        }
        form.resetDirty();
    }, [isOpen]);

    // Clear selected category if it was deleted while the modal is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!selectedCategory || !categories) return;
        if (!categories.some(c => c.id === selectedCategory.id)) {
            setSelectedCategory(null);
            form.setFieldValue("categoryId", undefined);
        }
    }, [categories]);

    // ─────────────────────────────────────────────────────────────────────────

    return {
        form,
        charCount,
        editorKey,
        selectedCategory,
        handleSelectCategory,
        handleBodyChange,
        handleToggleVisibility,
        handleSubmit,
        handleClose,
        handleDiscard,
        handleReset: resetForm,
        isEditing,
        MAX_BODY_LENGTH,
    };
};