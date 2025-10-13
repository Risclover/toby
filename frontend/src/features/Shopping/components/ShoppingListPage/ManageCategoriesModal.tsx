import { ManageCategoriesIcon } from "@/assets/icons/ManageCategoriesIcon";
import { useCreateShoppingCategoryMutation, useDeleteShoppingCategoryMutation, type ShoppingCategory } from "@/store/categorySlice";
import { useGetShoppingListCategoriesQuery } from "@/store/shoppingSlice";
import { Button, Group, Modal, Table, Text, TextInput, Tooltip } from "@mantine/core"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import React, { useState } from "react";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded';

type Props = {
    opened: boolean;
    open: () => void;
    close: () => void;
    listId: number;
}
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
export const ManageCategoriesModal = ({ opened, close, open, listId }: Props) => {
    const { data: categories = [] } = useGetShoppingListCategoriesQuery(listId);
    const [category, setCategory] = useState("");
    const [createShoppingCategory, { isLoading: loading }] = useCreateShoppingCategoryMutation();
    const [error, setError] = useState("");

    const [deleteCategory] = useDeleteShoppingCategoryMutation();

    const handleAddCategory = async () => {
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
            setCategory("");
        } catch (err) {
            const message = getErrorMessage(err)
            console.log('create failed:', message)
            setError(message);
            // e.g., set form error UI
            // setFieldError('name', message)
        }
        // tell parent which category was created so it can select + persist
    };

    const handleModalClick = () => {
        open()
    }

    const handleAddInputChange = (e) => {
        setError("");
        setCategory(e.target.value);
    }

    const rows = categories?.map(category =>
        <Table.Tr>
            <Table.Td>{category.name}</Table.Td>
            <Table.Td>
                <Group gap="sm" justify="flex-end">
                    <Button size="xs" color="cyan"><EditRoundedIcon style={{ fontSize: "1.1rem" }} /></Button>
                    <Button size="xs" color="red" onClick={() => handleDeleteCategory(category)}><DeleteRoundedIcon style={{ fontSize: "1.1rem" }} /></Button>
                </Group>
            </Table.Td>
        </Table.Tr>)

    const handleDeleteCategory = async (category: ShoppingCategory) => {
        const data = await deleteCategory({ id: category.id, listId: listId }).unwrap();
        console.log('data:', data);

    }

    return <>
        {opened && <Modal opened={opened} onClose={close} size="xs" centered title="Manage Categories">
            <div className="add-category-container">
                <TextInput
                    value={category}
                    onChange={handleAddInputChange}
                    placeholder="Add a new category"
                    required
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        // Ignore IME composition (Japanese/Chinese/etc.)
                        if ((e as any).nativeEvent?.isComposing) return;

                        if (e.key === 'Enter' || e.key === 'NumpadEnter') {
                            e.preventDefault();   // prevent form submit / blur behaviors
                            handleAddCategory();  // NOTE: don't pass `val` — use state `category`
                        }
                    }}
                    error={error}
                    styles={{
                        root: { width: "80%", marginRight: "0.5rem" }
                    }}
                />
                <Button color="cyan" onClick={handleAddCategory}>Add</Button>
            </div>
            <div className="categories-table">
                <h3>Categories</h3>
                <Table styles={(theme) => ({
                    thead: {
                        fontFamily: "Alan Sans, sans-serif",
                        fontWeight: "100",
                        fontSize: "1rem"
                    },
                    td: {
                        color: theme.white,                      // header text color
                        fontWeight: 600,
                        paddingBlock: '0.4rem',
                        fontSize: "0.9rem"
                    }
                })} withRowBorders={false}>
                    <Table.Tbody>
                        {rows}
                    </Table.Tbody>
                </Table>
            </div>
        </Modal >}

        <Tooltip arrowOffset={50} arrowSize={8} label="Manage categories" withArrow>
            <Button color="cyan.3" variant="transparent" onClick={handleModalClick}>
                <ManageCategoriesIcon />
            </Button>
        </Tooltip>
    </>
}