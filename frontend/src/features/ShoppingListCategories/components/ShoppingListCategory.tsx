import { useDeleteShoppingCategoryMutation, useEditShoppingCategoryMutation, type ShoppingCategory } from "@/store"
import { TextInput } from "@mantine/core"
import { ShoppingListCategoryMenu } from "./ShoppingListCategoryMenu";
import { useState } from "react";

type Props = {
    category: ShoppingCategory;
}

export const ShoppingListCategory = ({ category }: Props) => {
    const [editing, setEditing] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [name, setName] = useState(category.name);
    const [editCategory] = useEditShoppingCategoryMutation();
    const [deleteCategory] = useDeleteShoppingCategoryMutation();

    const handleEditCategory = async () => {
        const trimmed = name.trim();
        if (trimmed.length > 25) {
            return;
        }
        if (trimmed === category.name || trimmed === "") {
            setName(category.name);
            setEditing(false);
            return;
        }
        await editCategory({ id: category.id, listId: category.listId, name: trimmed }).unwrap();
        setEditing(false);
    }

    const handleDeleteCategory = async () => {
        await deleteCategory({ id: category.id, listId: category.listId }).unwrap();
    }

    return (
        <li className="shopping-category-item">
            {editing ? (
                <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleEditCategory()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditCategory();
                        if (e.key === "Escape") {
                            setName(category.name);
                            setEditing(false);
                        }
                    }}
                    autoFocus
                    maxLength={25}
                    variant="unstyled"
                    styles={{
                        input: {
                            borderBottom: "1px solid var(--border)",
                            borderRadius: 0,
                            padding: 0,
                            paddingTop: "2px",
                            paddingBottom: "2px",
                            paddingLeft: 0,
                            borderLeft: "none",
                            margin: 0,
                            fontSize: "var(--text-sm)",
                            minHeight: "unset",
                            height: "unset",
                        }
                    }}
                    w="100%"
                />
            ) : (
                <div className="shopping-category-item-name">{name}</div>
            )}
            <ShoppingListCategoryMenu
                category={category}
                onEdit={() => setEditing(true)}
                onDelete={handleDeleteCategory}
                showDeleteConfirmation={showDeleteConfirmation}
                setShowDeleteConfirmation={setShowDeleteConfirmation}
            />
        </li>
    )
}