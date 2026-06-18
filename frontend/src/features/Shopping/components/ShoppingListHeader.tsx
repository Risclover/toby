import { ShoppingListCategories } from "@/features/ShoppingListCategories/components/ShoppingListCategories";
import type { ShoppingList } from "@/store";
import { ActionIcon, Tooltip } from "@mantine/core";
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import { useState } from "react";

type Props = {
    list: ShoppingList;
}
export const ShoppingListHeader = ({ list }: Props) => {
    const [showCategories, setShowCategories] = useState(false);
    return (
        <div className="shopping-list-header">
            <div className="shopping-list-header--right"></div>
            <div className="shopping-list-header--left">
                <Tooltip.Group openDelay={500} closeDelay={100}>
                    <Tooltip withArrow label="Categories">
                        <ActionIcon
                            variant="subtle"
                            color="rgb(5, 5, 73)"
                            onClick={() => setShowCategories(true)}
                        >
                            <CategoryRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withArrow label="Filter list">
                        <ActionIcon variant="subtle" color="rgb(5, 5, 73)">
                            <FilterAltRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                </Tooltip.Group>
            </div>
            <ShoppingListCategories
                opened={showCategories}
                onClose={() => setShowCategories(false)}
                list={list}
            />
        </div>
    )
}