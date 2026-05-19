import { MobileHomeNavGrid } from "@/components"
import { useCreateShoppingListModal } from "@/contexts/CreateShoppingListContext"
import { ShoppingLists } from "@/features"
import { CreateShoppingListModal } from "@/features/Shopping/components/CreateShoppingListModal"
import { ShoppingListsTitleComponent } from "@/features/Shopping/components/ShoppingListsTitleComponent"
import { useIsSmallScreen } from "@/hooks"
import { MobileLayout } from "@/layout"

export const ShoppingListsPage = () => {
    const isSmall = useIsSmallScreen(768);
    const { isOpen, openModal, closeModal } = useCreateShoppingListModal();

    return (
        <MobileLayout titleComponent={<ShoppingListsTitleComponent openModal={openModal} />}>
            <MobileHomeNavGrid activeTab={3} />
            <div className={`mobile-tasklists-content${isSmall ? " content-padding" : ""}`}>
                {/* Empty state */}
                <ShoppingLists />
            </div>
            <CreateShoppingListModal opened={isOpen} onClose={closeModal} />
        </MobileLayout>
    )
}