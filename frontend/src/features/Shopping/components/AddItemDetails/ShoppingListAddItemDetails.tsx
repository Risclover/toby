import { useState } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { DetailPopover } from "./DetailPopover";
import { ShoppingListAddItemQuantity } from "./ShoppingListAddItemQuantity";

export const ShoppingListAddItemDetails = ({ quantity, setQuantity }: { quantity: number; setQuantity: (q: number) => void }) => {
    const [draftQuantity, setDraftQuantity] = useState(quantity);
    const [qtyOpened, setQtyOpened] = useState(false);

    const handleQtyOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setDraftQuantity(quantity); // sync draft to current committed value when opening
        } else {
            setQuantity(draftQuantity); // commit on close
        }
        setQtyOpened(isOpen);
    };

    const itemDetails = [
        {
            name: quantity > 0 ? quantity.toString() : "Qty.",
            icon: <HiMiniArrowsUpDown />,
            dropdown: <ShoppingListAddItemQuantity quantity={draftQuantity} onCommit={setDraftQuantity} />,
            opened: qtyOpened,
            onChange: handleQtyOpenChange,
        }
    ]

    return (
        <div className="add-item-details-container">
            {itemDetails.map(item => (
                <DetailPopover
                    key={item.name}
                    name={item.name}
                    icon={item.icon}
                    dropdown={item.dropdown}
                    opened={item.opened}
                    onChange={item.onChange}
                />
            ))}
        </div>
    )
}