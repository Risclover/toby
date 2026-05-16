import { MobileHomeNavGrid } from "@/components"
import { useCreateShoppingListModal } from "@/contexts/CreateShoppingListContext"
import { ShoppingListsTitleComponent } from "@/features/Shopping/components/ShoppingListsTitleComponent"
import { useIsSmallScreen } from "@/hooks"
import { MobileLayout } from "@/layout"

export const ShoppingListsPage = () => {
    const isSmall = useIsSmallScreen(768);
    const { openModal } = useCreateShoppingListModal();

    return (
        <MobileLayout titleComponent={<ShoppingListsTitleComponent />}>
            <MobileHomeNavGrid activeTab={3} />
            <div className={`mobile-tasklists-content${isSmall ? " content-padding" : ""}`}>
                {/* Empty state */}
                {/* Lists grid */}
            </div>
            {/* Create shopping list modal */}
        </MobileLayout>
    )
}