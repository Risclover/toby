import { useForm, type UseFormInput, type UseFormReturnType } from "@mantine/form";
import { useEffect, useRef, useState } from "react";


export type UseSettingsModalOptions<TValues extends Record<string, unknown>> = {
    /**
     * The ID of the entity being edited. The hook watches this value and reinitializes the form whenever it changes, so switching from list A to list B always starts clean.
     */
    entityId: number | undefined;
    initialValues: TValues;
    defaultValues?: Partial<TValues>;
    validate?: UseFormInput<TValues>["validate"];
    onSubmit: (values: TValues) => Promise<void>;
    onClose: () => void;

    // Minimum time (ms) to hold the loading spinner even if the request resolves instantly - prevents a jarring flash. Defaults to 400.
    minimumLoadingMs?: number;
}

export type UseSettingsModalReturn<TValues extends Record<string, unknown>> = {
    form: UseFormReturnType<TValues>;
    isSubmitting: boolean;
    showDiscardWarning: boolean;
    setShowDiscardWarning: (val: boolean) => void;
    showDeleteConfirmation: boolean;
    setShowDeleteConfirmation: (val: boolean) => void;
    handleClose: () => void;
    handleDiscardConfirmation: () => void;
    handleSubmit: () => Promise<void>;
    handleResetToDefaults: () => void;
}

export function useSettingsModal<TValues extends Record<string, unknown>>({
    entityId,
    initialValues,
    defaultValues,
    validate,
    onSubmit,
    onClose,
    minimumLoadingMs = 400,
}: UseSettingsModalOptions<TValues>): UseSettingsModalReturn<TValues> {
    const form = useForm<TValues>({ initialValues, validate });
    const initializedForId = useRef<number | null>(null);

    useEffect(() => {
        if (entityId === undefined) return;
        if (initializedForId.current === entityId) return;

        form.setValues(initialValues);
        form.resetDirty();
        initializedForId.current = entityId;
    }, [entityId]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDiscardWarning, setShowDiscardWarning] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const handleClose = () => {
        if (form.isDirty()) {
            setShowDiscardWarning(true);
        } else {
            onClose();
        }
    }

    const handleDiscardConfirmation = () => {
        setShowDiscardWarning(false);
        onClose();
    }

    const handleSubmit = async () => {
        if (!form.isValid()) {
            form.validate();
            return;
        }

        setIsSubmitting(true);

        try {
            await Promise.all([
                onSubmit(form.getValues()),
                new Promise<void>(resolve => setTimeout(resolve, minimumLoadingMs)),
            ]);
            form.resetDirty();
        } catch {
            // Leave form dirty so the user can correct and retry
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleResetToDefaults = () => {
        if (!defaultValues) return;
        form.setValues(defaultValues);
    }

    return {
        form,
        isSubmitting,
        showDiscardWarning,
        setShowDiscardWarning,
        showDeleteConfirmation,
        setShowDeleteConfirmation,
        handleClose,
        handleDiscardConfirmation,
        handleSubmit,
        handleResetToDefaults,
    }
}