import { EditableTitle } from '@/component/EditableTitle'
import type { ShoppingList } from '@/store/householdSlice'
import { useEditShoppingListMutation, useGetShoppingItemsQuery } from '@/store/shoppingSlice'
import { Button, Progress, Select, Tooltip } from '@mantine/core'
import { skipToken } from '@reduxjs/toolkit/query'
import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { ManageCategoriesIcon } from '@/assets/icons/ManageCategoriesIcon'
import { FaTags } from "react-icons/fa";

type ViewMode = "flat" | "category";

type Props = {
    list: ShoppingList;
    viewMode: ViewMode;                     // <-- add
    onChangeViewMode: (v: ViewMode) => void; // <-- add
}

export const ShoppingListHeader = ({ list, viewMode, onChangeViewMode }: Props) => {
    const navigate = useNavigate();
    const { listId } = useParams();
    const [updateShoppingList] = useEditShoppingListMutation();

    const { data: items = [] } = useGetShoppingItemsQuery(
        Number(listId) ? listId : (skipToken as any)
    );

    const { percent } = useMemo(() => {
        const total = items.length;
        const done = items.filter((t) => t.purchased === true).length;
        const raw = total ? (done / total) * 100 : 0;
        const percent = Math.min(100, Math.max(0, Math.round(raw)));
        return { percent };
    }, [items]);

    const handleUpdateTitle = async (next: string) => {
        if (!list) return; // guard
        await updateShoppingList({ listId: list.id, title: next }).unwrap();
    };

    const viewToLabel = (v: ViewMode) => (v === "flat" ? "Flat" : "By Category");
    const labelToView = (s: string | null): ViewMode => (s === "By Category" ? "category" : "flat");

    return (
        <div className="shopping-list-header">
            <div onClick={() => navigate(-1)}>&lt; Back</div>

            <div className="household-tasklist-page-title">
                <EditableTitle
                    title={list?.title ?? ""}   // <-- always a string
                    onSave={handleUpdateTitle}
                />
                <div className="list-header-select">
                    View
                    <Select
                        placeholder="Pick value"
                        value={viewToLabel(viewMode)}               // <-- controlled value
                        onChange={(val) => onChangeViewMode(labelToView(val))} // <-- lift state up
                        data={["Flat", "By Category"]}
                        styles={{
                            wrapper: { width: "100%", minWidth: "150px", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                            input: {
                                borderRadius: "0.5rem",
                                border: 0,
                                width: "100%",
                                paddingLeft: "1rem",
                                paddingTop: "1rem",
                                paddingBottom: "1rem",
                                background: "var(--main-background)",
                                color: "white"
                            },
                            section: { background: "transparent" },
                            dropdown: { background: "var(--main-background)", border: "1px solid white", borderRadius: "0.5rem" },
                            options: { background: "var(--main-background)", color: "white" },
                        }}
                    />

                </div>
                <div className="list-header-select" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                    Sort
                    <Select
                        placeholder="Pick value"
                        data={['A → Z', 'Z → A', 'Qty ↑', 'Qty ↓', 'Category A → Z', 'Category Z → A']}
                        styles={{
                            wrapper: { width: "100%", minWidth: "150px", border: "1px solid var(--main-border)", borderRadius: "0.5rem" },
                            input: {
                                borderRadius: "0.5rem",
                                border: 0,
                                width: "100%",
                                paddingLeft: "1rem",
                                paddingTop: "1rem",
                                paddingBottom: "1rem",
                                background: "var(--main-background)",
                                color: "white"
                            },
                            section: { background: "transparent" },
                            dropdown: { background: "var(--main-background)", border: "1px solid white", borderRadius: "0.5rem" },
                            options: { background: "var(--main-background)", color: "white" },
                        }}
                    />

                </div>
                <Tooltip.Group openDelay={500} closeDelay={100}>
                    <Tooltip arrowOffset={50} arrowSize={8} label="Settings" withArrow>
                        <Button color="cyan.3" variant="transparent">
                            <SettingsRoundedIcon />
                        </Button>
                    </Tooltip>
                    <Tooltip arrowOffset={50} arrowSize={8} label="Manage categories" withArrow>
                        <Button color="cyan.3" variant="transparent">
                            <ManageCategoriesIcon />
                        </Button>
                    </Tooltip>
                </Tooltip.Group>
            </div>

            <div className="household-tasklist-page-progress">
                <div className="progress-left">
                    <Progress color="cyan" value={percent} />
                </div>
                {percent}%
            </div>
        </div>
    )
}
