import { useGetShoppingItemCategoryQuery } from "@/store/shoppingSlice"
import { ShoppingListItem } from "../ShoppingListItem";

type Props = {
    itemId: number;
}

export const ShoppingListCategorySection = ({ itemId }: Props) => {
    const { data: itemCategory } = useGetShoppingItemCategoryQuery(itemId);

    console.log('data: itemCategory:', itemCategory)
    return (
        <div className="category-section">
            {itemCategory?.name}
            {itemCategory?.items.map(item => <ShoppingListItem key={item.id} item={item} />)}
        </div>
    )
}