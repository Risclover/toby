import type { ShoppingList } from "@/store";
import { CheckIcon, Drawer, Radio, Switch } from "@mantine/core";

type Props = {
    opened: boolean;
    onClose: () => void;
    list: ShoppingList;
    groupByCategory: boolean;
    setGroupByCategory: (val: boolean) => void;
    sort: "created" | "alpha" | null;
    setSort: (val: "created" | "alpha" | null) => void;
}

type SortOption = "created" | "alpha";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "created", label: "By time of creation" },
    { value: "alpha", label: "A → Z" },
];

export const ShoppingListOptionsDrawer = ({ opened, onClose, list, groupByCategory, setGroupByCategory, sort, setSort }: Props) => {
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
                    styles={{
                        root: { width: "100%" },
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
                    >
                        <Radio
                            color={list.color}
                            icon={CheckIcon}
                            label={option.label}
                            value={option.value}
                            checked={sort === option.value}
                            onChange={(e) => setSort(e.currentTarget.value as SortOption)}
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
    );
};