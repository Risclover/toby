import type { ShoppingItem } from "@/store";

type Props = {
    items: ShoppingItem[];
}

export const useShoppingList = ({ items }: Props) => {
    const total = items.length;
    const completed = items.filter((i) => i.isChecked);
    const uncompleted = items.filter((i) => !i.isChecked);

    const rawPercent = total ? (completed.length / total) * 100 : 0;
    const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

    const remainingCount = Math.max(0, uncompleted.length - 3);

    return {
        percent,
        totalCount: total,
        completedCount: completed.length,
        uncompleted,
        completed,
        remainingCount
    }
}