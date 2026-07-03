// ShoppingListSettingsBehaviorTab.tsx
import { Button, Group, Select, Stack, Switch, Tabs, Text } from "@mantine/core";
import { SettingsItem } from "@/components/SettingsItem";
import type { useShoppingListSettings } from "../../hooks/useShoppingListSettings";

type Props = Pick<ReturnType<typeof useShoppingListSettings>, "form" | "list">;

const SORT_OPTIONS: { value: "created" | "alpha"; label: string }[] = [
    { value: "created", label: "By created date" },
    { value: "alpha", label: "A → Z" },
];

export const ShoppingListSettingsBehaviorTab = ({ form, list }: Props) => {
    return (
        <Tabs.Panel value="behavior" style={{ overflowY: "auto", padding: "16px", minHeight: 0 }}>
            <SettingsItem
                layout="column"
                label="Default sort"
                description="Set the default sort order for items in this list."
                divider={true}
            >
                <Select
                    allowDeselect={false}
                    {...form.getInputProps("defaultSort")}
                    data={[
                        { value: "created", label: "By created date" },
                        { value: "alpha", label: "A → Z" },
                    ]}
                />
            </SettingsItem>

            <SettingsItem
                layout="row"
                label="Group by category"
                description="Group items into their assigned categories by default."
                divider={false}
            >
                <Switch
                    {...form.getInputProps("groupByCategory", { type: "checkbox" })}
                    color={list.color}
                    size="md"
                    withThumbIndicator={false}
                />
            </SettingsItem>
        </Tabs.Panel>
    );
};