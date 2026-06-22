import { useState } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { DetailPopover } from "./DetailPopover";
import { ShoppingListAddItemQuantity } from "./ShoppingListAddItemQuantity";
import { ShoppingListAddItemUnit } from "./ShoppingListAddItemUnit";
import { ShoppingListAddItemCategory } from "./ShoppingListAddItemCategory";
import type { ShoppingList } from "@/store";

type Props = {
    list: ShoppingList;
    quantity: number;
    setQuantity: (q: number) => void;
    draftQuantity: number;
    setDraftQuantity: (q: number) => void;
    unit: string;
    setUnit: (u: string) => void;
    categoryId: number | null;
    setCategoryId: (id: number | null) => void;
}
export const ShoppingListAddItemDetails = ({ list, quantity, setQuantity, draftQuantity, setDraftQuantity, unit, setUnit, categoryId, setCategoryId }: Props) => {
    const [qtyOpened, setQtyOpened] = useState(false);
    // Snapshot of quantity at the moment the popover opens — used to revert on Escape
    const [qtySnapshot, setQtySnapshot] = useState(quantity);

    const handleQtyOpenChange = (isOpen: boolean, explicitValue?: number) => {
        if (isOpen) {
            setQtySnapshot(quantity);
            setDraftQuantity(quantity);
        } else {
            // explicitValue is always provided (Enter, blur, or Escape passing snapshot back)
            // undefined fallback to draftQuantity covers Mantine's onChange on outside-container click
            setQuantity(explicitValue ?? draftQuantity);
        }
        setQtyOpened(isOpen);
    };

    return (
        <div className="add-item-details-container">
            <DetailPopover
                name={quantity > 0 ? quantity.toString() : "Qty."}
                icon={<HiMiniArrowsUpDown />}
                dropdown={<ShoppingListAddItemQuantity
                    quantity={qtySnapshot}
                    onCommit={setDraftQuantity}
                    onClose={(finalValue) => handleQtyOpenChange(false, finalValue)}
                />}
                opened={qtyOpened}
                onChange={handleQtyOpenChange}
                onCommit={setDraftQuantity}
                onClose={(finalValue) => handleQtyOpenChange(false, finalValue)}
            />
            <ShoppingListAddItemUnit
                unit={unit}
                quantity={quantity}
                onCommit={setUnit}
                onClose={(finalValue) => setUnit(finalValue ?? "")}
            />
            <ShoppingListAddItemCategory
                list={list}
                categoryId={categoryId}
                onCommit={setCategoryId}
                onClose={(finalValue) => setCategoryId(finalValue ?? null)}
            />
        </div>
    )
}