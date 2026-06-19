import { TextInput } from "@mantine/core"
import { ShoppingListCategoryMenu } from "./ShoppingListCategoryMenu";
import { useShoppingListCategory } from "../hooks/useShoppingListCategory";
import { type ShoppingCategory } from "@/store"

type Props = {
    /** Category to display */
    category: ShoppingCategory;
    /** Whether the category is being edited */
    isEditing: boolean;
    /** Function to set the editing state */
    setIsEditing: (editing: boolean) => void;
}

/** Single shopping list category item (for shopping list categories modal) */
export const ShoppingListCategory = ({ category, isEditing, setIsEditing }: Props) => {
    const {
        name,
        setName,
        handleEditCategory,
        handleDeleteCategory,
        showDeleteConfirmation,
        setShowDeleteConfirmation,
        cancelledRef
    } = useShoppingListCategory({ category, isEditing, setIsEditing });

    return (
        <li className="shopping-category-item">
            {isEditing ? (
                <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleEditCategory()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditCategory();
                        if (e.key === "Escape") {
                            cancelledRef.current = true;
                            setName(category.name);
                            setIsEditing(false);
                        }
                    }}
                    autoFocus
                    maxLength={25}
                    variant="unstyled"
                    styles={{
                        input: {
                            borderBottom: "1px solid var(--border)",
                            borderRadius: 0,
                            paddingTop: "2px",
                            paddingBottom: "2px",
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
                onEdit={() => setIsEditing(true)}
                onDelete={handleDeleteCategory}
                showDeleteConfirmation={showDeleteConfirmation}
                setShowDeleteConfirmation={setShowDeleteConfirmation}
            />
        </li>
    )
}