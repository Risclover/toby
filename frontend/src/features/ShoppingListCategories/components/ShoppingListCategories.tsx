import { RemainingChars } from "@/components";
import { useIsSmallScreen } from "@/index";
import { useCreateShoppingCategoryMutation, useGetShoppingListCategoriesQuery, type ShoppingList } from "@/store";
import { ActionIcon, Button, Modal, TextInput } from "@mantine/core"
import { useState } from "react";
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import { ShoppingListCategory } from "./ShoppingListCategory";

type Props = {
    opened: boolean;
    onClose: () => void;
    list: ShoppingList;
}

const MAX_CATEGORIES = 10;

export const ShoppingListCategories = ({ opened, onClose, list }: Props) => {
    const [categoryName, setCategoryName] = useState("");
    const [addCategory] = useCreateShoppingCategoryMutation();
    const { data: categories } = useGetShoppingListCategoriesQuery(list.id);
    const isSmall = useIsSmallScreen(425);

    const handleAddCategory = async () => {
        if (categories && categories.length >= MAX_CATEGORIES || categoryName.trim() === "") {
            return;
        }
        await addCategory({ listId: list.id, name: categoryName }).unwrap();
        setCategoryName("");
    }

    if (!categories) return null;

    return (
        <Modal.Root
            opened={opened}
            onClose={onClose}
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
                            {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((category) => (
                                <ShoppingListCategory key={category.id} category={category} />
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
                        {categories.length >= MAX_CATEGORIES ?
                            <div className="shopping-list-category-input-note--error">Max categories reached.</div> :
                            <div className="shopping-list-category-input-note--limit">Limit 10 categories per list.</div>
                        }
                        <RemainingChars count={categoryName.length} max={25} />
                    </div>
                </div>
            </Modal.Content>
        </Modal.Root >
    )
}