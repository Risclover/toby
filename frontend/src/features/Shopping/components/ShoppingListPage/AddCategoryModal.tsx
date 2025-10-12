// AddCategoryModal.tsx
import { useCreateShoppingCategoryMutation } from "@/store/categorySlice"; // ensure correct file
import { Button, Group, Modal, Space, TextInput } from "@mantine/core";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import React, { useState, type SetStateAction } from "react";

type Props = {
    open: boolean;
    close: React.Dispatch<SetStateAction<boolean>>;
    listId: number;
    onCreated?: (cat: { id: number; name: string }) => void; // <-- new
};

function getErrorMessage(err: unknown) {
    // RTK Query's fetchBaseQuery errors look like: { status, data }
    if (err && typeof err === 'object' && 'data' in err) {
        const e = err as FetchBaseQueryError & { data?: any }
        // Your API sends: { error: "..." }
        if (e.data && typeof e.data === 'object' && 'error' in e.data) {
            return String((e.data as any).error)
        }
        // fallback to a stringified payload
        return JSON.stringify(e.data)
    }
    // SerializedError or something unexpected
    return (err as any)?.message ?? 'Something went wrong'
}

export const AddCategoryModal = ({ open, close, listId, onCreated }: Props) => {
    const [category, setCategory] = useState("");
    const [createShoppingCategory, { isLoading }] = useCreateShoppingCategoryMutation();
    const [error, setError] = useState("");

    const handleClick = async () => {
        const name = category.trim();
        if (!name) return;

        try {
            const created = await createShoppingCategory({
                // IMPORTANT: server expects `shoppingListId`, not `listId`
                name,
                listId,
            }).unwrap()

            // Success path: created is the JSON your route returns (category.to_dict())
            console.log('created:', created)
            onCreated?.({ id: created.id, name: created.name });
            setCategory("");
            close(false);
        } catch (err) {
            const message = getErrorMessage(err)
            console.log('create failed:', message)
            setError(message);
            // e.g., set form error UI
            // setFieldError('name', message)
        }
        // tell parent which category was created so it can select + persist
    };

    return (
        <Modal centered opened={open} onClose={() => close(false)} title="Add Category">
            <TextInput
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Dairy"
                required
                error={error}
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
