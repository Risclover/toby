import { Button, Group, Modal, TextInput, useModalsStack } from "@mantine/core";

import { FormColorInput, RemainingChars } from "@/components";
import { useModalFocus } from "@/hooks";
import { useCreateNoteCategory } from "../hooks";
import { type PersonalNoteCategory } from "@/store/noteCategorySlice";

import "../styles/PersonalNoteCategories.css";

type Props = {
    /** Modal visibility */
    opened?: boolean;
    /** Callback for closing the modal */
    close: () => void;
    /** Called with newly-created category after successful creation (not used in Edit mode) */
    onCategoryCreated?: (category: PersonalNoteCategory) => void;
    /** Modal stack instance, for usage inside `Modal.Stack`. */
    stack?: ReturnType<typeof useModalsStack>;
    /** When provided, form is prefilled with this category's values ('edit' mode). */
    category?: PersonalNoteCategory | null;
    /** Notifies parent modal that a sub-modal is open; used to suppress parent escape-key handling. */
}

/**
 * Modal form for creating or editing a personal note category.
 *
 * Operates in two modes:
 * - **Create mode** (default): empty form, calls `createCategory` on submit and fires `onCategoryCreated`.
 * - **Edit mode**: pre-fills with `category` values, calls `updateCategory` on submit.
 *
 * Mode is determined by the presence of the `category` prop.
 *
 * @example
 * // Create mode — standalone
 * <CreateNoteCategory
 *   opened={showModal}
 *   close={() => setShowModal(false)}
 *   onCategoryCreated={handleSelectCategory}
 * />
 *
 * @example
 * // Edit mode — inside a Modal.Stack
 * <CreateNoteCategory
 *   stack={stack}
 *   category={editingCategory}
 *   close={() => { 
 *      setEditingCategory(null); 
 *      stack.close('edit'); 
 *   }}
 * />
*/
export const CreateNoteCategory = ({ opened, close, onCategoryCreated, stack, category }: Props) => {
    const { ref: nameRef, transitionProps } = useModalFocus();

    const {
        form,
        handleClose,
        handleSubmit,
        isEditing,
        hasColorError
    } = useCreateNoteCategory({ close, category, onCategoryCreated })

    return (
        <Modal
            opened={opened ?? false}
            {...stack?.register("edit")}
            onClose={handleClose}
            transitionProps={transitionProps}
            title={isEditing ? "Edit category" : "Create notes category"}
            radius="md"
            size="sm"
            centered
            closeOnEscape={false}
            onKeyDownCapture={(e) => {
                if (e.key === "Escape") {
                    e.stopPropagation();
                    handleClose();
                }
            }}
        >
            <form
                className="create-notes-category-form"
                onSubmit={(e) => {
                    e.stopPropagation();
                    handleSubmit(e);
                }}
            >
                {/* Name input */}
                <TextInput
                    label="Name"
                    required
                    radius="md"
                    maxLength={20}
                    ref={nameRef}
                    {...form.getInputProps("name")}
                />
                <RemainingChars count={form.values.name.trim().length} max={20} />

                {/* Color input */}
                <FormColorInput label="Color" form={form} required />
                <div className="form-input-error" style={{ height: "16px", marginTop: "4px" }}>
                    {hasColorError ? "This color is too light. Please choose something darker." : null}
                </div>

                {/* Footer (form buttons) */}
                <div className="create-notes-category-form--footer">
                    <Group justify="flex-end" mt="md">
                        <Button
                            h="auto"
                            p=".5rem 1rem"
                            size="sm"
                            fw={500}
                            color="rgb(5, 5, 73)"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!form.isDirty() || !form.isValid()}
                            type="submit"
                            h="auto"
                            p=".5rem 1rem"
                            size="sm"
                            fw={500}
                            color="rgb(5, 5, 73)"
                        >
                            Save
                        </Button>
                    </Group>
                </div>
            </form>
        </Modal>
    );
};