import { Button, Modal, TextInput } from "@mantine/core"
import { RemainingChars } from "@/components";
import { ShoppingListCategory } from "./ShoppingListCategory";
import { useShoppingListCategories } from "../hooks/useShoppingListCategories";
import { type ShoppingList } from "@/store";

type Props = {
    /** Whether the modal is opened */
    opened: boolean;
    /** Function to close the modal */
    onClose: () => void;
    /** Shopping list of which to manage categories */
    list: ShoppingList;
}

const MAX_CATEGORIES = 10;

/** Component to manage categories for specific shopping list */
export const ShoppingListCategories = ({ opened, onClose, list }: Props) => {
    const {
        categories,
        isSmall,
        categoryName,
        setCategoryName,
        isEditing,
        setIsEditing,
        handleAddCategory,
    } = useShoppingListCategories({ list, MAX_CATEGORIES });

    if (!categories) return null;

    return (
        <Modal.Root
            opened={opened}
            onClose={onClose}
            closeOnEscape={!isEditing}
            size="sm"
            radius="md"
            centered
            fullScreen={isSmall}
            styles={{
                body: { flex: 1, overflowY: "auto", padding: "1rem" },
                content: {
                    overflow: "hidden", display: "flex", flexDirection: "column"
                },
            }}
        >
            <Modal.Overlay />
            <Modal.Content>
                <Modal.Header>
                    <Modal.Title>Manage list categories</Modal.Title>
                    <Modal.CloseButton />
                </Modal.Header>
                <Modal.Body>
                    {categories.length === 0
                        ?
                        <div className="shopping-category-list--empty">
                            It's a little bare in here! Add your first category below.
                        </div>
                        :
                        <ul className="shopping-category-list">
                            {[...categories].sort((a, b) =>
                                a.name.localeCompare(b.name)).map((category) =>
                                (
                                    <ShoppingListCategory
                                        key={category.id}
                                        category={category}
                                        isEditing={isEditing}
                                        setIsEditing={setIsEditing}
                                    />
                                ))}
                        </ul>}
                </Modal.Body>
                <div className="add-category-container">
                    <div className="add-category-input-container">
                        <TextInput
                            styles={{ input: { border: "none", flexShrink: 0 } }}
                            placeholder="e.g. Dairy"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                            maxLength={25}
                            w="100%"
                        />
                        <Button
                            styles={{ root: { flexShrink: 0 } }}
                            color="rgb(5, 5, 73)"
                            size="sm"
                            fw={500}
                            h="auto"
                            onClick={handleAddCategory}
                            disabled={categories.length >= MAX_CATEGORIES || categoryName.trim() === ""}
                        >
                            Add
                        </Button>
                    </div>
                    <div className="shopping-list-category-input-note-container">
                        {categories.length >= MAX_CATEGORIES
                            ?
                            <div className="shopping-list-category-input-note--error">
                                Max categories reached.
                            </div>
                            :
                            <div className="shopping-list-category-input-note--limit">
                                Limit 10 categories per list.
                            </div>
                        }
                        <RemainingChars count={categoryName.length} max={25} />
                    </div>
                </div>
            </Modal.Content>
        </Modal.Root >
    )
}