import { Button } from "@mantine/core";

type Props = {
    name: string;
    icon: React.ReactNode;
}

export const ShoppingListAddItemDetail = ({ name, icon }: Props) => {
    return (
        <Button className="shopping-list-add-item-detail">
            <span className="add-item-detail-icon">
                {icon}
            </span>
            {name}
        </Button>
    )
}