import { useState } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { DetailPopover } from "./DetailPopover";
import { ShoppingListAddItemQuantity } from "./ShoppingListAddItemQuantity";
import { ShoppingListAddItemUnit } from "./ShoppingListAddItemUnit";

type Props = {
    quantity: number;
    setQuantity: (q: number) => void;
    unit: string;
    setUnit: (u: string) => void;
}
export const ShoppingListAddItemDetails = ({ quantity, setQuantity, unit, setUnit }: Props) => {
    const [draftQuantity, setDraftQuantity] = useState(quantity);
    const [qtyOpened, setQtyOpened] = useState(false);
    const [draftUnit, setDraftUnit] = useState(unit);
    const [unitOpened, setUnitOpened] = useState(false);

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
            />
            <ShoppingListAddItemUnit
                unit={draftUnit}
                quantity={draftQuantity}
                onCommit={setDraftUnit}
                onClose={(finalValue) => handleUnitOpenChange(false, finalValue)}
            />
        </div>
    )
}