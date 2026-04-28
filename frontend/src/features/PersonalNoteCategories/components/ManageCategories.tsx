import { useGetCategoriesQuery } from "@/store";
import { Modal, useModalsStack } from "@mantine/core";
import { CategoryMenu } from "./CategoryMenu";
import { CreateNoteCategory } from "./CreateNoteCategory";
import { useState } from "react";
import type { PersonalNoteCategory } from "@/store/noteCategorySlice";

type Props = {
    opened: boolean;
    setShowManageCategories: (val: boolean) => void;
}

export const ManageCategories = ({ opened, setShowManageCategories }: Props) => {
    const stack = useModalsStack(['manage', 'edit']);
    const { data: categories } = useGetCategoriesQuery();
    const [editingCategory, setEditingCategory] = useState<PersonalNoteCategory | null>(null);

    const handleEditClick = (category: PersonalNoteCategory) => {
        setEditingCategory(category);
        stack.open('edit');
    };

    return (
        <Modal.Stack>
            <Modal {...stack.register('manage')} centered title="Manage categories" opened={opened} onClose={() => setShowManageCategories(false)} size="xs">
                {categories?.length === 0
                    ? <div className="empty-categories-menu">No categories yet</div>
                    : categories?.map(category => (
                        <div key={category.id} className="manage-category-item">
                            <div className="category-drawer-item-details">
                                <div style={{ background: category.color }} className="category-item-color" />
                                <span className="category-drawer-item-name">{category.name}</span>
                            </div>
                            <div className="manage-category-menu">
                                <CategoryMenu
                                    setShowManageCategories={setShowManageCategories}
                                    category={category}
                                    onEditClick={handleEditClick}
                                />
                            </div>
                        </div>
                    ))
                }
                <div className="manage-categories-capacity">Categories used: {categories?.length ?? 0} / 10</div>
            </Modal>
            <CreateNoteCategory
                stack={stack}
                category={editingCategory}
                close={() => { setEditingCategory(null); stack.close('edit'); }}
            />
        </Modal.Stack>
    );
};