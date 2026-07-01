import { useUpdateListOptionsMutation, type ShoppingList } from "@/store";
import { CheckIcon, Drawer, Radio, Switch } from "@mantine/core"
import { useEffect, useState } from "react";

type Props = {
    opened: boolean;
    onClose: () => void;
    list: ShoppingList;
}

type SortOption = "created" | "alpha";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "created", label: "By time of creation" },
    { value: "alpha", label: "A → Z" },
];

export const ShoppingListOptionsDrawer = ({ opened, onClose, list }: Props) => {
    const [updateListOptions] = useUpdateListOptionsMutation();

    const [groupByCategory, setGroupByCategory] = useState(list.groupByCategory);
    const [sort, setSort] = useState(list.defaultSort);

    const handleUpdateListOptions = async () => {
        await updateListOptions({
            listId: list.id,
            defaultSort: sort,
            groupByCategory: groupByCategory
        }).unwrap();
    }

    useEffect(() => {
        handleUpdateListOptions();
    }, [groupByCategory, sort]);

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="bottom"
            radius="md"
            title="List options"
            size={250}
        >
            <div className="shopping-list-options-drawer--section">
                <Switch
                    onChange={(e) => setGroupByCategory(e.currentTarget.checked)}
                    checked={groupByCategory}
                    onClick={(e) => e.stopPropagation()}
                    onMouseUp={handleUpdateListOptions}
                    styles={{
                        root: {
                            width: "100%",
                        },
                        body: {
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            fontSize: "15px"
                        },
                        label: {
                            fontSize: "14px",
                            fontWeight: 400
                        }
                    }}
                    labelPosition="left"
                    label="Group by categories"
                    color={list.color}
                    withThumbIndicator={false}
                    size="md"
                />
            </div>

            <div className="shopping-list-options-drawer--sort-section">
                <span className="shopping-list-options-drawer--sort-label">Sort Options</span>
                {SORT_OPTIONS.map((option) => (
                    <div
                        key={option.value}
                        className="sort-option"
                        onClick={() => setSort(option.value)}
                    // onClick={() => onSortChange(option.value)}
                    >
                        <Radio
                            color={list.color}
                            icon={CheckIcon}
                            label={option.label}
                            value={option.value}
                            checked={sort === option.value}
                            onChange={(e) => setSort(e.currentTarget.value as SortOption)}
                            onMouseUp={handleUpdateListOptions}
                            name="sort-options"
                            size="sm"
                            labelPosition="left"
                            onClick={(e) => e.stopPropagation()}
                            styles={{
                                root: {
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    height: "100%",
                                    padding: ".25rem .25rem",
                                    fontFamily: "var(--font-family-sora)"
                                },
                                body: {
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontWeight: 400
                                }
                            }}
                        />
                    </div>
                ))}
            </div>
        </Drawer>
    )
}