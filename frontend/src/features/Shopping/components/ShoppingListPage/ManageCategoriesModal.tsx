import { ManageCategoriesIcon } from "@/assets/icons/ManageCategoriesIcon";
import {
    useCreateShoppingCategoryMutation,
    useDeleteShoppingCategoryMutation,
    useEditShoppingCategoryMutation,
    type ShoppingCategory,
} from "@/store/categorySlice";
import { useGetShoppingListCategoriesQuery } from "@/store/shoppingSlice";
import { Button, Group, Modal, Popover, Stack, Table, Text, TextInput, Tooltip } from "@mantine/core";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import React, { useRef, useState } from "react";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { ManageCategoryItem, type ManageCategoryItemHandle } from "./ManageCategoryItem";
import { DeleteCategoryPopover } from "./DeleteCategoryPopover";

type Props = {
    opened: boolean;
    open: () => void;
    close: () => void;
    listId: number;
};

function getErrorMessage(err: unknown) {
    if (err && typeof err === "object" && "data" in err) {
        const e = err as FetchBaseQueryError & { data?: any };
        if (e.data && typeof e.data === "object" && "error" in e.data) {
            return String((e.data as any).error);
        }
        return JSON.stringify(e.data);
    }
    return (err as any)?.message ?? "Something went wrong";
}

export const ManageCategoriesModal = ({ opened, close, open, listId }: Props) => {
    // Map of categoryId -> row handle (imperative)
    const rowRefs = useRef<Record<number, ManageCategoryItemHandle | null>>({});

    const { data: categories = [] } = useGetShoppingListCategoriesQuery(listId);
    const [category, setCategory] = useState("");
    const [createShoppingCategory] = useCreateShoppingCategoryMutation();
    const [error, setError] = useState("");
    const [showPopover, setShowPopover] = useState(false);
    const [deleteCategory] = useDeleteShoppingCategoryMutation();
    const [editShoppingCategory] = useEditShoppingCategoryMutation();
    const handleAddCategory = async () => {
        const name = category.trim();
        if (!name) return;

        try {
            const created = await createShoppingCategory({
                // your server arg shape; adjust if API expects shoppingListId
                name,
                listId,
            }).unwrap();

            console.log("created:", created);
            setCategory("");
            setError("")
        } catch (err) {
            const message = getErrorMessage(err);
            console.log("create failed:", message);
            setError(message);
        }
    };

    const handleModalClick = () => {
        open();
    };

    const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setCategory(e.target.value);
    };

    // Attach/detach a handle per row
    const setRowRef =
        (id: number) => (el: ManageCategoryItemHandle | null) => {
            rowRefs.current[id] = el;
        };

    const handleEditClick = (id: number) => {
        // Tell the row to switch into edit mode and focus
        rowRefs.current[id]?.startEdit();
    };

    const handleDeleteCategory = async (cat: ShoppingCategory) => {
        const data = await deleteCategory({ id: cat.id, listId }).unwrap();
        console.log("deleted:", data);
    };

    const rows = categories?.map((cat) => (
        <Table.Tr key={cat.id}>
            <Table.Td>
                <ManageCategoryItem
                    ref={setRowRef(cat.id)}
                    categoryId={cat.id}
                    categoryName={cat.name}
                    onSave={(id, next) => {
                        editShoppingCategory({ categoryId: id, listId, name: next });
                    }}
                    onCancel={() => { }}
                />
            </Table.Td>
            <Table.Td>
                <Group gap="sm" justify="flex-end">
                    <Button size="xs" color="cyan" onClick={() => handleEditClick(cat.id)}>
                        <EditRoundedIcon style={{ fontSize: "1.1rem" }} />
                    </Button>
                    <DeleteCategoryPopover cat={cat} listId={listId} />
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            {opened && (
                <Modal opened={opened} onClose={close} size="sm" centered title="Manage Categories">
                    <div className="add-category-container">
                        <TextInput
                            value={category}
                            onChange={handleAddInputChange}
                            placeholder="Add a new category"
                            title="Add a new category"
                            required
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if ((e as any).nativeEvent?.isComposing) return;
                                if (e.key === "Enter" || e.key === "NumpadEnter") {
                                    e.preventDefault();
                                    handleAddCategory();
                                }
                            }}
                            error={error}
                            styles={{
                                root: { width: "80%", marginRight: "0.5rem" },
                            }}
                        />
                        <Button color="cyan" onClick={handleAddCategory}>
                            Add
                        </Button>
                    </div>

                    <div className="categories-table">
                        <h3>Categories</h3>
                        {categories.length === 0 && <div className="no-categories-msg">This list has no categories.</div>}
                        <Table
                            styles={(theme) => ({
                                thead: {
                                    fontFamily: "Alan Sans, sans-serif",
                                    fontWeight: "100",
                                    fontSize: "1rem",
                                },
                                td: {
                                    color: theme.white,
                                    fontWeight: 600,
                                    paddingBlock: "0.4rem",
                                    fontSize: "0.9rem",
                                },
                            })}
                            withRowBorders={false}
                        >
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </div>
                </Modal>
            )}

            <Tooltip arrowOffset={50} arrowSize={8} label="Manage categories" withArrow>
                <Button color="cyan.3" variant="transparent" onClick={handleModalClick}>
                    <ManageCategoriesIcon />
                </Button>
            </Tooltip>
        </>
    );
};
