import { DetailPopover } from "./DetailPopover";
import { ShoppingListAddItemQuantity } from "./ShoppingListAddItemQuantity";
import { ShoppingListAddItemUnit } from "./ShoppingListAddItemUnit";
import { ShoppingListAddItemCategory } from "./ShoppingListAddItemCategory";
import { useShoppingListAddItemDetails } from "../../hooks/useShoppingListAddItemDetails";
import type { ShoppingList } from "@/store";
import type { ShoppingItemDetails, ShoppingItemDetailsHandlers } from "../../types";
import { HiMiniArrowsUpDown } from "react-icons/hi2";

/** Props for ShoppingListAddItemDetails. */
type Props = {
    /** The shopping list the new item will belong to (needed for category options). */
    list: ShoppingList;
    /** Current quantity/unit/category values for the item being added. */
    details: ShoppingItemDetails;
    /** Setters for each field in `details`. */
    onDetailsChange: ShoppingItemDetailsHandlers;
};

/**
 * Row of quantity, unit, and category pickers shown under the add-item
 * input once the user focuses it.
 */
export const ShoppingListAddItemDetails = ({ list, details, onDetailsChange }: Props) => {
    const { qtySnapshot, handleQtyOpenChange, handleQtyClose, handleUnitClose, handleCategoryClose } =
        useShoppingListAddItemDetails(details, onDetailsChange);

    return (
        <div className="add-item-details-container">
            <DetailPopover
                name={details.quantity > 0 ? details.quantity.toString() : "Qty."}
                icon={<HiMiniArrowsUpDown />}
                dropdown={
                    <ShoppingListAddItemQuantity
                        quantity={qtySnapshot}
                        onCommit={onDetailsChange.setDraftQuantity}
                        onClose={handleQtyClose}
                    />
                }
                opened={details.qtyOpened}
                onChange={handleQtyOpenChange}
                onCommit={onDetailsChange.setDraftQuantity}
                onClose={handleQtyClose}
            />
            <ShoppingListAddItemUnit
                unit={details.unit}
                quantity={details.quantity}
                onCommit={onDetailsChange.setUnit}
                onClose={handleUnitClose}
            />
            <ShoppingListAddItemCategory
                list={list}
                categoryId={details.categoryId}
                onCommit={onDetailsChange.setCategoryId}
                onClose={handleCategoryClose}
            />
        </div>
    );
};
