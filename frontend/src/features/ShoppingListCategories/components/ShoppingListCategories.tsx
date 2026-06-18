import { RemainingChars } from "@/components";
import { useIsSmallScreen } from "@/index";
import { useCreateShoppingCategoryMutation, useGetShoppingListCategoriesQuery, type ShoppingList } from "@/store";
import { Button, Modal, TextInput } from "@mantine/core"
import { useState } from "react";

type Props = {
    opened: boolean;
    onClose: () => void;
    list: ShoppingList;
}

export const ShoppingListCategories = ({ opened, onClose, list }: Props) => {
    const [categoryName, setCategoryName] = useState("");
    const [addCategory] = useCreateShoppingCategoryMutation();
    const { data: categories } = useGetShoppingListCategoriesQuery(list.id);
    const isSmall = useIsSmallScreen(425);

    const handleAddCategory = async () => {
        await addCategory({ listId: list.id, name: categoryName, color: "rgb(5, 5, 73)" }).unwrap();
        setCategoryName("");
    }
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
                    <ul className="shopping-category-list">
                        {categories?.map((category) => (
                            <li key={category.id} className="shopping-category-item">
                                {category.name}
                            </li>
                        ))}
                    </ul>
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
                        >
                            Add
                        </Button>
                    </div>
                    <RemainingChars count={categoryName.length} max={25} />
                </div>
            </Modal.Content>
        </Modal.Root >
    )
}