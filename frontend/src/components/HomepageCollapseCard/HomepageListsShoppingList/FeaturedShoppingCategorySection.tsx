import type { ShoppingItem } from "@/store";
import { FeaturedShoppingItem } from "./FeaturedShoppingItem";

type Props = {
    title: string;
    items: ShoppingItem[];
    listId: number;
    fadesOutOnCheck: boolean;
    color: string;
}

export const FeaturedShoppingCategorySection = ({ title, items, listId, fadesOutOnCheck, color }: Props) => {
    if (items.length === 0) return null;
    return (
        <div className="featured-shopping-category-section">
            <div className="homepage-collapse-card-title featured-list-title">{title}</div>
            <ul className="homepage-lists-shopping-container">
                {items.map(item => (
                    <FeaturedShoppingItem key={item.id} item={item} listId={listId} fadesOutOnCheck={fadesOutOnCheck} color={color} />
                ))}
            </ul>
        </div>
    );
};