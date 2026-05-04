import { CheckIcon, Drawer, Radio, useModalsStack, type DrawerProps } from "@mantine/core";
import type { SortOption } from "../../hooks";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "alpha", label: "A → Z" },
    { value: "category_alpha", label: "By category" },
    { value: "private_first", label: "Private first" },
];

type Props = {
    /** Drawer stack instance, for usage inside `Drawer.Stack`. */
    stack: ReturnType<typeof useModalsStack>;
    /** Props for drawer component */
    drawerProps: DrawerProps;
    /** Active sort option */
    sort: SortOption;
    /** Handler for when user changes active sort option */
    onSortChange: (val: SortOption) => void;
};

/** 'Sort by' options drawer, where user can use radio buttons to select how they want notes to be sorted. */
export const PersonalNotesSortDrawer = ({ stack, drawerProps, sort, onSortChange }: Props) => {
    return (
        <Drawer
            title="Sort by"
            {...drawerProps}
            {...stack.register("sort")}
        >
            <Radio.Group value={sort} onChange={(val) => onSortChange(val as SortOption)}>
                <div className="sort-options-list">
                    {SORT_OPTIONS.map(option => (
                        <div
                            key={option.value}
                            className="sort-option"
                            onClick={() => onSortChange(option.value)}
                        >
                            <Radio
                                color="rgb(5, 5, 73)"
                                icon={CheckIcon}
                                value={option.value}
                                label={option.label}
                                labelPosition="left"
                                onClick={(e) => e.stopPropagation()}
                                styles={{
                                    root: {
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        height: "100%",
                                        padding: ".5rem .25rem",
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
            </Radio.Group>
        </Drawer>
    );
};