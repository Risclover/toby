import type { ShoppingItem } from "@/store";
import { getUnitLabel } from "../../constants/shoppingUnits";

type Props = {
    item: ShoppingItem;
}

export const ShoppingListItemDetailPill = ({ item }: Props) => {
    const unitLabel = item.unit && item.quantity ? getUnitLabel(item.unit, item.quantity) : null;

    if (!item.quantity) return null;

    return (
        <div className="shopping-list-item-detail-pill">
            {item.quantity} {unitLabel}
        </div>
    )
}