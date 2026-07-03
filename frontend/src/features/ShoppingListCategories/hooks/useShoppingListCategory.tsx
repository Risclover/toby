import { useEffect, useRef, useState } from "react";
import { KittyNotification } from "@/components";
import { useDeleteShoppingCategoryMutation, useEditShoppingCategoryMutation, type ShoppingCategory } from "@/store"
import { KittyIcons } from "@/assets";

type Props = {
    /** Category to manage */
    category: ShoppingCategory;
    /** Function to set the editing state */
    setIsEditing: (editing: boolean) => void;
}

/** Custom hook for managing the state and actions of ShoppingListCategory */
export const useShoppingListCategory = ({ category, setIsEditing }: Props) => {
    const [editCategory] = useEditShoppingCategoryMutation();
    const [deleteCategory] = useDeleteShoppingCategoryMutation();

    const cancelledRef = useRef(false);

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [name, setName] = useState(category.name);

    useEffect(() => {
        setName(category.name);
    }, [category.name]);

    const handleEditCategory = async () => {
        const trimmed = name.trim();
        if (trimmed.length > 25 || trimmed === category.name || trimmed === "") {
            setName(category.name);
            setIsEditing(false);
            return;
        }

        if (cancelledRef.current) {
            cancelledRef.current = false;
            return;
        }

        try {
            await editCategory({ id: category.id, listId: category.listId, name: trimmed }).unwrap();
            setIsEditing(false);
            KittyNotification({
                title: "Category successfully updated",
                message: <>The category "<strong style={{ fontWeight: 500 }}>{name}</strong>" has been given a fresh name. Lookin' good!</>,
                color: "green",
                icon: KittyIcons.Cowboy
            })
        } catch (error) {
            console.error("Error editing category:", error);
            KittyNotification({
                title: "Shoot - the category didn't update!",
                message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is feeling particularly stubborn today. Please try again.</>,
                color: "red",
                icon: KittyIcons.Tired
            })
        }
    }

    const handleDeleteCategory = async () => {
        try {
            await deleteCategory({ id: category.id, listId: category.listId }).unwrap();
            KittyNotification({
                title: "Category successfully deleted",
                message: <>Poof! "<strong style={{ fontWeight: 500 }}>{name}</strong>" has been sent to the void.</>,
                color: "green",
                icon: KittyIcons.Space
            })
        } catch (error) {
            console.error("Error deleting category:", error);
            KittyNotification({
                title: "The category wants to stay!",
                message: <>"<strong style={{ fontWeight: 500 }}>{name}</strong>" is refusing to be deleted. It's too strong for you! Try again.</>,
                color: "red",
                icon: KittyIcons.Workout
            })
        }
    }

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleEditCategory();
        if (e.key === "Escape") {
            cancelledRef.current = true;
            setName(category.name);
            setIsEditing(false);
        }
    }

    return {
        name,
        setName,
        handleEditCategory,
        handleDeleteCategory,
        showDeleteConfirmation,
        setShowDeleteConfirmation,
        handleNameKeyDown
    }
}