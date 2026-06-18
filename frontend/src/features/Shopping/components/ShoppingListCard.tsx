import { StarIcon, StarIconOutline } from "@/assets";
import type { ShoppingList } from "@/store"
import { ActionIcon, Avatar, Progress, Text, Tooltip } from "@mantine/core"
import "../styles/ShoppingLists.css"
import { ShoppingListActionsMenu } from "./ShoppingListActionsMenu";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { MemberAvatarGroup } from "@/features/HouseholdTasklists";
import { useMemo } from "react";
import { useHousehold } from "@/hooks/useHousehold";
import { useShoppingList } from "../hooks/useShoppingList";
import { ShoppingListItem } from "./ShoppingListItem";

type Props = {
    list: ShoppingList;
}

export const ShoppingListCard = ({ list }: Props) => {
    const { data: household } = useHousehold();
    const navigate = useNavigate();

    const navigateToShoppingList = () => {
        navigate(`/shopping/${list.id}`)
    }


    const householdMembers = household?.members;

    const listMembers = useMemo(() =>
        householdMembers?.filter((m: any) => list?.memberIds?.includes(m?.id)) ?? [],
        [householdMembers, list?.memberIds])

    const { completed, uncompleted, percent, completedCount, remainingCount } = useShoppingList({ items: list.items });

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
                        <Progress color="rgb(5, 5, 73)" value={percent} />
                    </div>
                    {percent}%
                </div>
            </div>
            <div className={`shopping-list-card-body`}>
                <span className="shopping-list-empty-state">
                    {uncompleted.length === 0 && (completedCount === 0 ? "Empty list." : "🏅 All completed!")}
                </span>
                <ul>
                    {list.items.slice(0, 3).map((item: any) => (
                        <ShoppingListItem item={item} />
                    ))}
                </ul>
                {remainingCount > 0 && <div className="household-tasklist-bottom">+ {remainingCount} more</div>}
            </div>
            <div className="shopping-list-card-footer">
                <MemberAvatarGroup members={listMembers} limit={3} />
            </div>
        </div>
    )
}