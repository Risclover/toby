import { Button, Group, NumberInput, Select, Textarea } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useEditShoppingItemCategoryMutation, useEditShoppingItemQuantityMutation, useGetShoppingListCategoriesQuery } from '@/store/shoppingSlice';
import { AddCategoryModal } from './AddCategoryModal';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

type Item = {
    id: number;
    shoppingListId: number;
    name: string;
    quantity: number;
    purchased: boolean;
    categoryId: number | undefined;       // <-- use id on the item
    categoryName?: string | null;
};

type Props = { item: Item };

export const ItemExpanded = ({ item }: Props) => {
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [quantity, setQuantity] = useState(item.quantity);
    const { data: categories = [] } = useGetShoppingListCategoriesQuery(item.shoppingListId);
    const [editItemCategory] = useEditShoppingItemCategoryMutation();
    const [editItemQuantity] = useEditShoppingItemQuantityMutation();

    // Local state is the *string* id that Mantine Select wants
    const [categoryId, setCategoryId] = useState<string | null>(
        item.categoryId != null ? String(item.categoryId) : null
    );

    // keep local state in sync if parent item changes
    useEffect(() => {
        setCategoryId(item.categoryId != null ? String(item.categoryId) : null);
    }, [item.id, item.categoryId]);

    // map categories to Select options (value must be a string)
    const selectData = useMemo(
        () => categories.map((c: { id: number; name: string }) => ({ value: String(c.id), label: c.name })),
        [categories]
    );

    const handleChangeCategory = async (val: string | null) => {
        setCategoryId(val);

        // map selected id -> category name
        const categoryName =
            val ? categories.find((c: { id: number; name: string }) => String(c.id) === val)?.name ?? null : null;

        await editItemCategory({
            itemId: item.id,
            listId: item.shoppingListId,
            category: categoryName, // <-- send NAME (or null to clear)
        }).unwrap();
    };

    const handleChangeQuantity = async (val: string) => {
        setQuantity(Number(val));
        const data = await editItemQuantity({ itemId: item.id, listId: item.shoppingListId, quantity: quantity })
        console.log('Q DATA:', data);
    }

    return (
        <div className="shopping-item-expanded-container">
            <div className="shopping-item-expanded">
                <div className="shopping-item-expanded-top">
                    <div className="shopping-item-expanded-input-section">
                        <label htmlFor={`quantity-${item.id}`}>Qty:</label>
                        <NumberInput
                            id={`quantity-${item.id}`}
                            name="quantity"
                            min={1}
                            defaultValue={item.quantity || 1}
                            value={item.quantity}                // ⬅️ controlled by cache, not defaultValue
                            onChange={(v) => {
                                const q = typeof v === "number" ? v : parseInt(v || "1", 10);
                                if (!Number.isNaN(q) && q >= 1) {
                                    // fire mutation; your optimistic update already updates the cache immediately
                                    editItemQuantity({ itemId: item.id, listId: item.shoppingListId, quantity: q });
                                }
                            }}
                            clampBehavior="strict"
                            styles={{
                                wrapper: { width: '80px', background: 'var(--main-background)', borderColor: 'var(--main-border)', borderRadius: '0.5rem', overflow: 'hidden' },
                                input: { width: '80px', background: 'var(--main-background)', color: 'white', borderColor: 'var(--main-border)', borderRadius: '0.5rem', overflow: 'hidden' },
                            }}
                        />
                    </div>
                    <div className="shopping-item-expanded-input-section">
                        <label htmlFor={`category-${item.id}`}>Category:</label>
                        <Group justify="flex-start" styles={{ root: { gap: "0.5rem" } }}>
                            <Select
                                id={`category-${item.id}`}
                                name="categoryId"
                                data={selectData}
                                clearable
                                value={categoryId}                // controlled
                                onChange={handleChangeCategory}   // val is string | null
                                styles={{
                                    wrapper: { width: '200px', border: '1px solid var(--main-border)', borderRadius: '0.5rem' },
                                    input: { fontFamily: 'Nunito Sans, sans-serif', borderRadius: '0.5rem', border: 0, paddingTop: '1rem', paddingBottom: '1rem', background: 'var(--main-background)', color: 'white' },
                                    section: { background: 'transparent' },
                                    dropdown: { background: 'var(--main-background)', border: '1px solid white', borderRadius: '0.5rem' },
                                    options: { background: 'var(--main-background)', color: 'white' },
                                }}
                            />

                            <Button title="Create category" variant="filled" color="cyan" size="xs" onClick={() => setShowAddCategoryModal(true)}>
                                <AddRoundedIcon />
                            </Button>
                        </Group>
                        {showAddCategoryModal && (
                            <AddCategoryModal
                                open={showAddCategoryModal}
                                close={setShowAddCategoryModal}
                                listId={item.shoppingListId}
                                onCreated={(cat) => {
                                    // Select the new category in the dropdown *right away*
                                    setCategoryId(String(cat.id));

                                    // Persist it on the server (your backend expects the NAME)
                                    editItemCategory({
                                        itemId: item.id,
                                        listId: item.shoppingListId,
                                        category: cat.name,
                                    });
                                }}
                            />
                        )}
                    </div>
                </div>
                <div className="shopping-item-expanded-input-section">
                    <label htmlFor={`notes-${item.id}`}>Notes:</label>
                    <Textarea autosize minRows={2} maxRows={4} styles={{
                        wrapper: { width: '100%', background: 'var(--main-background)', borderColor: 'var(--main-border)', borderRadius: '0.5rem', },
                        input: { width: '100%', background: 'var(--main-background)', color: 'white', borderColor: 'var(--main-border)', borderRadius: '0.5rem', },
                    }} />
                </div>
            </div>
        </div>
    );
};
