import { StarIcon, StarIconOutline } from "@/assets";
import type { ShoppingList } from "@/store"
import { ActionIcon, Progress, Text, Tooltip } from "@mantine/core"
import "../styles/ShoppingLists.css"
import { ShoppingListActionsMenu } from "./ShoppingListActionsMenu";
import { useNavigate } from "react-router-dom";

type Props = {
    list: ShoppingList;
}

export const ShoppingListCard = ({ list }: Props) => {
    const navigate = useNavigate();

    const navigateToShoppingList = () => {
        navigate(`/shopping/${list.id}`)
    }
    return (
        <div className="shopping-list-card" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigateToShoppingList} onClick={navigateToShoppingList}>
            <div className="shopping-list-card-header">
                <div className="shopping-list-card-header--top">
                    <Text lh={1.2} lineClamp={2} c="black" fw={500} className="shopping-list-head-title">{list.title}</Text>
                    <div className="shopping-list-card-header--top header-right">
                        <Tooltip withArrow label="Featured">
                            <ActionIcon variant="transparent" size="compact-xs" color="rgb(5, 5, 73)">
                                <StarIconOutline size="20px" color="var(--mantine-color-gray-6)" />
                            </ActionIcon>
                        </Tooltip>
                        <ShoppingListActionsMenu />
                    </div>
                </div>
                <div className="shopping-list-card-header--progress progress">
                    <div className="progress-left">
                        <Progress color="rgb(5, 5, 73)" value={50} />
                    </div>
                    100%
                </div>
            </div>
            <div className={`shopping-list-card-body`}>
                <span className="shopping-list-empty-state">
                    {/* Empty state*/}
                </span>
                <ul>
                    {/* Shopping list items */}
                </ul>
                {/* Remaining count ("+1 more") */}
            </div>
            <div className="shopping-list-card-footer">
                {/* Avatar group */}
                hi
            </div>
        </div>
    )
}