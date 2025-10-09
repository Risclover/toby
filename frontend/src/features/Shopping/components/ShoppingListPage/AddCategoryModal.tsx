// AddCategoryModal.tsx
import { useCreateShoppingCategoryMutation } from "@/store/categorySlice"; // ensure correct file
import { Button, Group, Modal, Space, TextInput } from "@mantine/core";
import React, { useState, type SetStateAction } from "react";

type Props = {
    open: boolean;
    close: React.Dispatch<SetStateAction<boolean>>;
    listId: number;
    onCreated?: (cat: { id: number; name: string }) => void; // <-- new
};

export const AddCategoryModal = ({ open, close, listId, onCreated }: Props) => {
    const [category, setCategory] = useState("");
    const [createShoppingCategory, { isLoading }] = useCreateShoppingCategoryMutation();

    const handleClick = async () => {
        const name = category.trim();
        if (!name) return;

        const created = await createShoppingCategory({ name, listId }).unwrap();

        // tell parent which category was created so it can select + persist
        onCreated?.({ id: created.id, name: created.name });

        setCategory("");
        close(false);
    };

    return (
        <Modal centered opened={open} onClose={() => close(false)} title="Add Category">
            <TextInput
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Dairy"
                required
            />
            <Space h="md" />
            <Group justify="flex-end">
                <Button variant="light" color="cyan" onClick={() => close(false)}>Cancel</Button>
                <Button color="cyan" variant="filled" onClick={handleClick} disabled={!category.trim() || isLoading}>
                    {isLoading ? "Adding..." : "Submit"}
                </Button>
            </Group>
        </Modal>
    );
};
