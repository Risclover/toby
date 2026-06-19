import { useDeleteShoppingCategoryMutation, useEditShoppingCategoryMutation, type ShoppingCategory } from "@/store"
import { TextInput } from "@mantine/core"
import { ShoppingListCategoryMenu } from "./ShoppingListCategoryMenu";
import { useState } from "react";
import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

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

        try {
            await editCategory({ id: category.id, listId: category.listId, name: trimmed }).unwrap();
            setEditing(false);
            KittyNotification({
                title: "Category successfully updated",
                message: <>The category "<strong style={{ fontWeight: 500 }}>{name}</strong>" has been given a fresh name. Lookin' good!</>,
                color: "green",
                icon: KittyIcons.Flower
            })
        } catch (error) {
            console.error("Error editing category:", error);
            KittyNotification({
                title: "Shoot - the category didn't update!",
                message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is feeling particularly stubborn today. Please try again.</>,
                color: "red",
                icon: KittyIcons.Pout
            })
        }
    }

    const handleDeleteCategory = async () => {
        try {
            await deleteCategory({ id: category.id, listId: category.listId }).unwrap();
            KittyNotification({
                title: "Shopping list category successfully deleted",
                message: <>Poof! "<strong style={{ fontWeight: 500 }}>{name}</strong>" has been sent to the void.</>,
                color: "green",
                icon: KittyIcons.Astronaut
            })
        } catch (error) {
            console.error("Error deleting category:", error);
            KittyNotification({
                title: "The category wants to stay!",
                message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is refusing to be deleted. It's too strong for you! Try again.</>,
                color: "red",
                icon: KittyIcons.Ghost
            })
        }
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