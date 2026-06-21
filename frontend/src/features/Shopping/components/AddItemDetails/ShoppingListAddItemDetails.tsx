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
    unit: string;
    setUnit: (u: string) => void;
    category: string;
    setCategory: (c: string) => void;
}
export const ShoppingListAddItemDetails = ({ list, quantity, setQuantity, unit, setUnit, category, setCategory }: Props) => {
    const [draftQuantity, setDraftQuantity] = useState(quantity);
    const [qtyOpened, setQtyOpened] = useState(false);
    const [draftUnit, setDraftUnit] = useState(unit);
    const [unitOpened, setUnitOpened] = useState(false);
    const [draftCategory, setDraftCategory] = useState("");

    const handleQtyOpenChange = (isOpen: boolean, explicitValue?: number) => {
        if (isOpen) {
            setDraftQuantity(quantity);
        } else {
            setQuantity(explicitValue ?? draftQuantity);
        }
        setQtyOpened(isOpen);
    };

    const handleUnitOpenChange = (isOpen: boolean, explicitValue?: string) => {
        if (isOpen) {
            setDraftUnit(unit);
        } else {
            setUnit(explicitValue ?? draftUnit);
        }
        setUnitOpened(isOpen);
    };

    const handleCategoryOpenChange = (isOpen: boolean, explicitValue?: string) => {
        if (isOpen) {
            setDraftCategory(category);
        } else {
            setCategory(explicitValue ?? draftCategory);
        }
    }

    return (
        <div className="add-item-details-container">
            <DetailPopover
                name={quantity > 0 ? quantity.toString() : "Qty."}
                icon={<HiMiniArrowsUpDown />}
                dropdown={<ShoppingListAddItemQuantity
                    quantity={draftQuantity}
                    onCommit={setDraftQuantity}
                    onClose={(finalValue) => handleQtyOpenChange(false, finalValue)}
                />}
                opened={qtyOpened}
                onChange={handleQtyOpenChange}
                onCommit={setDraftQuantity}
                onClose={(finalValue) => handleQtyOpenChange(false, finalValue)}

            />
            <ShoppingListAddItemUnit
                unit={draftUnit}
                quantity={draftQuantity}
                onCommit={setDraftUnit}
                onClose={(finalValue) => handleUnitOpenChange(false, finalValue)}
            />
            <ShoppingListAddItemCategory
                list={list}
                category={draftCategory}
                onCommit={setDraftCategory}
                onClose={(finalValue) => handleCategoryOpenChange(false, finalValue)}
            />
        </div>
    )
}