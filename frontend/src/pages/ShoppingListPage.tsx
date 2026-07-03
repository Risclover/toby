import { ArchiveNotice, ShoppingListAddItem } from "@/features";
import { ShoppingListContainer } from "@/features/Shopping/components/ShoppingList/ShoppingListContainer";
import { ShoppingListHeader } from "@/features/Shopping/components/ShoppingListHeader";
import { ShoppingListTitleComponent } from "@/features/Shopping/components/ShoppingList/ShoppingListTitleComponent";
import { MobileLayout } from "@/layout";
import { useGetShoppingListQuery } from "@/store"
import { useParams } from "react-router-dom";
import { ShoppingListSettings } from "@/features/Shopping/components/ShoppingListSettings/ShoppingListSettings";
import { useState } from "react";

export const ShoppingListPage = () => {
    const { listId } = useParams();
    const { data: list } = useGetShoppingListQuery(Number(listId));
    const [showSettings, setShowSettings] = useState(false);
    const [groupByCategory, setGroupByCategory] = useState<boolean | null>(null);
    const [sort, setSort] = useState<"created" | "alpha" | null>(null);

    if (!list) return null;

    const resolvedGroupByCategory = groupByCategory ?? list.groupByCategory;
    const resolvedSort = sort ?? list.defaultSort;

    return (
        <MobileLayout titleComponent={<ShoppingListTitleComponent showSettings={showSettings} setShowSettings={setShowSettings} list={list} />}>
            <ShoppingListHeader
                list={list}
                groupByCategory={resolvedGroupByCategory}
                setGroupByCategory={setGroupByCategory}
                sort={resolvedSort}
                setSort={setSort}
            />
            {list.isArchived && <ArchiveNotice listId={list.id} itemType="shoppinglist" />}
            <ShoppingListContainer
                list={list}
                groupByCategory={resolvedGroupByCategory}
                sort={resolvedSort}
            />
            <ShoppingListAddItem list={list} />
            {showSettings && (
                <ShoppingListSettings
                    opened={showSettings}
                    onClose={() => setShowSettings(false)}
                    list={list}
                />
            )}
        </MobileLayout>
    );
};