import { useAuthenticateQuery, useGetShoppingListQuery, type ShoppingItem } from "@/store"; // adjust names to match your actual exports
import { useGetFeaturedShoppingListSettingsQuery } from "@/store/featuredShoppingListSettingSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { FeaturedShoppingHeader, FeaturedShoppingCategorySection, FeaturedShoppingItem, FeaturedShoppingQuickAddBar } from ".";
import { useFeaturedShoppingDisplay } from "@/hooks";
import { InfoTooltip } from "../../InfoTooltip";

export const HomepageListsShoppingList = ({ isReady }: { isReady: boolean }) => {
    const { data: user } = useAuthenticateQuery();
    const { data: userSettings } = useGetFeaturedShoppingListSettingsQuery();

    const featuredListId = userSettings?.featuredList.listId;
    const { data: list } = useGetShoppingListQuery(featuredListId ?? skipToken);

    const {
        uncheckedCount,
        totalCount,
        percent,
        categoryGroupsEnabled,
        displayedItems,
        truncated,
        visibleCheckedItems,
        fadesOutOnCheck,
        isVictoryState,
        isEmptyState,
    } = useFeaturedShoppingDisplay(list, userSettings?.featuredList);

    const showProgress = userSettings?.featuredList.showProgress ?? false;
    const showQuickAdd = userSettings?.featuredList.showQuickAdd ?? false;
    const view = userSettings?.featuredList.view ?? "compact";

    if (!isReady) return null; // swap in a shopping-specific skeleton if you have one

    return (
        <div className="homepage-lists-tasklist-container">
            {!featuredListId ? (
                <div className="featured-empty-state">
                    No shopping list featured.
                    <InfoTooltip tooltipLabel="Feature a list by using the star icon on the Shopping Lists page, or click the gear icon to open the Featured List Settings and select one there." tooltipWidth={220} />
                </div>
            ) : (
                <>
                    <FeaturedShoppingHeader
                        title={list?.title}
                        listId={list?.id}
                        uncheckedCount={uncheckedCount}
                        totalCount={totalCount}
                        percent={percent}
                        showProgress={showProgress}
                        color={list?.color}
                    />

                    {!isVictoryState && !isEmptyState && list && (
                        categoryGroupsEnabled ? (
                            <div className="homepage-lists-shopping">
                                {truncated.categoryGroups.map(group => (
                                    <FeaturedShoppingCategorySection key={group.category.id} title={group.category.name} items={group.items} listId={list.id} fadesOutOnCheck={fadesOutOnCheck} color={list.color} view={view} />
                                ))}
                                {truncated.uncategorized.length > 0 && (
                                    <FeaturedShoppingCategorySection title="Uncategorized" items={truncated.uncategorized} listId={list.id} fadesOutOnCheck={fadesOutOnCheck} color={list.color} view={view} />
                                )}
                                {visibleCheckedItems.length > 0 && (
                                    <FeaturedShoppingCategorySection title="Completed" items={visibleCheckedItems} listId={list.id} fadesOutOnCheck={fadesOutOnCheck} color={list.color} view={view} />
                                )}
                            </div>
                        ) : (
                            <ul className="homepage-lists-shopping">
                                {displayedItems.map((item: ShoppingItem) => (
                                    <FeaturedShoppingItem key={item.id} item={item} listId={list.id} fadesOutOnCheck={fadesOutOnCheck} color={list.color} view={view} />
                                ))}
                            </ul>
                        )
                    )}

                    {isVictoryState ? (
                        <div className="featured-empty-state">🛒 All items checked off! 🛒</div>
                    ) : (
                        isEmptyState && (
                            <div className="featured-empty-state">No matching items found.</div>
                        )
                    )}

                    {showQuickAdd && list && user?.householdId && (
                        <FeaturedShoppingQuickAddBar
                            listId={list.id}
                            householdId={user.householdId}
                            disabled={list.isArchived}
                            color={list.color}
                        />
                    )}
                </>
            )}
        </div>
    );
};