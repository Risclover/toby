import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { DetailPopover } from "./DetailPopover";
import { ShoppingListAddItemQuantity } from "./ShoppingListAddItemQuantity";
import { ShoppingListAddItemUnit } from "./ShoppingListAddItemUnit";
import { ShoppingListAddItemCategory } from "./ShoppingListAddItemCategory";
import type { ShoppingList } from "@/store";
import { useState } from "react";

type Props = {
    list: ShoppingList;
    quantity: number;
    setQuantity: (q: number) => void;
    draftQuantity: number;
    setDraftQuantity: (q: number) => void;
    qtyOpened: boolean;
    setQtyOpened: (open: boolean) => void;
    unit: string;
    setUnit: (u: string) => void;
    categoryId: number | null;
    setCategoryId: (id: number | null) => void;
}
export const ShoppingListAddItemDetails = ({ list, quantity, setQuantity, draftQuantity, setDraftQuantity, qtyOpened, setQtyOpened, unit, setUnit, categoryId, setCategoryId }: Props) => {
    const [qtySnapshot, setQtySnapshot] = useState(quantity);

    const handleQtyOpenChange = (isOpen: boolean, explicitValue?: number) => {
        if (isOpen) {
            setQtySnapshot(quantity);
            setDraftQuantity(quantity);
        } else {
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