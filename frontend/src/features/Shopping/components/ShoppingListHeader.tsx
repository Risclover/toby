import { ShoppingListCategories } from "@/features/ShoppingListCategories/components/ShoppingListCategories";
import { useIsScrolledToTop } from "@/hooks";
import type { ShoppingList } from "@/store";
import { ActionIcon, Tooltip } from "@mantine/core";
import { useState } from "react";
import { BiSolidCategory } from "react-icons/bi";
import { ShoppingListOptionsDrawer } from "./ShoppingList/ShoppingListOptionsDrawer";
import { IoOptions } from "react-icons/io5";

type Props = {
    list: ShoppingList;
    groupByCategory: boolean;
    setGroupByCategory: (val: boolean) => void;
    sort: "created" | "alpha" | null;
    setSort: (val: "created" | "alpha" | null) => void;
}

export const ShoppingListHeader = ({ list, groupByCategory, setGroupByCategory, sort, setSort }: Props) => {
    const [showCategories, setShowCategories] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const isAtTop = useIsScrolledToTop();

    return (
        <div className={`shopping-list-header${isAtTop ? "" : " header--stuck"}`}>
            <div className="shopping-list-header--right"></div>
            <div className="shopping-list-header--left">
                <Tooltip.Group openDelay={500} closeDelay={100}>
                    <Tooltip withArrow label="Manage categories">
                        <ActionIcon
                            variant="subtle"
                            color="rgb(5, 5, 73)"
                            onClick={() => setShowCategories(true)}
                        >
                            <BiSolidCategory size="24px" />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withArrow label="List options">
                        <ActionIcon variant="subtle" color="rgb(5, 5, 73)" onClick={() => setShowOptions(true)}>
                            <IoOptions size="2rem" />
                        </ActionIcon>
                    </Tooltip>
                </Tooltip.Group>
            </div>
            <ShoppingListCategories
                opened={showCategories}
                onClose={() => setShowCategories(false)}
                list={list}
            />
            <ShoppingListOptionsDrawer
                opened={showOptions}
                onClose={() => setShowOptions(false)}
                list={list}
                groupByCategory={groupByCategory}
                setGroupByCategory={setGroupByCategory}
                sort={sort}
                setSort={setSort}
            />
        </div>
    );
};