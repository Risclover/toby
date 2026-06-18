import { Modal, useModalsStack } from "@mantine/core";

import { CategoryMenu } from "./CategoryMenu";
import { CreateNoteCategory } from "./CreateNoteCategory";
import { MAX_CATEGORIES, useManageCategories } from "../hooks";
import { getContrastTextColor } from "@/utils";

type Props = {
    /** Modal visibility */
    opened: boolean;
    /** Closes the modal */
    setShowManageCategories: (val: boolean) => void;
}

/**
 * Modal for viewing, editing, and deleting personal note categories.
 *
 * Uses a modal stack to layer the edit form on top without closing the list.
 * Category limit is enforced via `MAX_CATEGORIES` from `useManageCategories`.
 */
export const ManageCategories = ({ opened, setShowManageCategories }: Props) => {
    const {
        stack,
        categories,
        editingCategory,
        handleEditClick,
        handleClose,
        handleCreateCategoryClose
    } = useManageCategories({ opened, setShowManageCategories });

    return (
        <Modal.Stack>
            <Modal
                {...stack.register('manage')}
                centered
                title="Manage categories"
                opened={opened}
                onClose={handleClose}
                size="xs"
                radius="md"
                closeOnEscape={false}
                onKeyDownCapture={(e) => {
                    if (e.key === "Escape") {
                        e.stopPropagation();
                        handleClose();
                    }
                }}
            >
                {categories?.length === 0
                    ? <div className="empty-categories-menu">No categories yet</div>
                    : categories?.map(category => (
                        <div key={category.id} className="manage-category-item">
                            <div className="category-drawer-item-details">
                                <div style={{ background: category.color }} className="category-item-color" />
                                <span className="category-drawer-item-name" style={{ color: getContrastTextColor(category.color) }}>{category.name}</span>
                            </div>
                            <div className="manage-category-menu">
                                <CategoryMenu category={category} onEditClick={handleEditClick} />
                            </div>
                        </div>
                    ))
                }
                {/* Displays current usage against the category limit */}
                <div className="manage-categories-capacity">
                    Categories used: {categories?.length ?? 0} / {MAX_CATEGORIES}
                </div>
            </Modal>
            <CreateNoteCategory
                stack={stack as ReturnType<typeof useModalsStack>}
                category={editingCategory}
                close={handleCreateCategoryClose}
            />
        </Modal.Stack>
    );
};