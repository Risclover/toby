/** Current values for the quantity/unit/category fields on a new shopping item. */
export type ShoppingItemDetails = {
    quantity: number;
    draftQuantity: number;
    qtyOpened: boolean;
    unit: string;
    categoryId: number | null;
};

/** Setters for each field in ShoppingItemDetails. */
export type ShoppingItemDetailsHandlers = {
    setQuantity: (quantity: number) => void;
    setDraftQuantity: (quantity: number) => void;
    setQtyOpened: (open: boolean) => void;
    setUnit: (unit: string) => void;
    setCategoryId: (categoryId: number | null) => void;
};