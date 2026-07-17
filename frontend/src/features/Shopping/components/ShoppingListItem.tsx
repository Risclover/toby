import { Checkbox } from "@mantine/core";
import type { ShoppingItem } from "@/store";

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