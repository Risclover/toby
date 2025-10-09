import type { ShoppingItem } from "@/store/shoppingSlice";
import { Checkbox } from "@mantine/core";


type Props = {
    item: ShoppingItem;
}

export const ShoppingListItem = ({ item }: Props) => {
    return <div className="household-tasklist-task">
        <Checkbox
            size="xs"
            radius='xl'
            readOnly
            checked={false}
        />
        {item.name}
    </div>
}