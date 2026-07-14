import { useCreateShoppingListModal } from "@/contexts/CreateShoppingListContext";
import { useIsSmallScreen } from "@/hooks";
import { useAuthenticateQuery, useGetShoppingListsQuery, type FeaturedListView } from "@/store";
import { useGetFeaturedShoppingListSettingsQuery, type FeaturedShoppingListSettings, type FeaturedShoppingListView } from "@/store/featuredShoppingListSettingSlice";
import { Divider, Input, Loader, Select, Space, Switch, Tabs, UnstyledButton } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { SettingsSection } from "./SettingsSection";
import { SettingsItem } from "../SettingsItem";
import { MaxTaskCountPicker } from "./MaxTaskCountPicker";
import { ShoppingViewSelector } from "@/features/Shopping/components/ShoppingListSettings/ShoppingViewSelector";



export type FeaturedShoppingListSettingsForm = UseFormReturnType<FeaturedShoppingListSettings>;

type Props = {
    form: FeaturedShoppingListSettingsForm;
    handleClose: () => void;
}

export const FeaturedShoppingListTab = ({ form, handleClose }: Props) => {
    const { openModal } = useCreateShoppingListModal();
    const isSmallScreen = useIsSmallScreen();

    const { data: user } = useAuthenticateQuery();
    const { data: lists, isLoading: isLoadingShoppingLists } = useGetShoppingListsQuery(
        { householdId: Number(user?.householdId), isArchived: false },
        { skip: !user?.householdId }
    );
    const { data: settings } = useGetFeaturedShoppingListSettingsQuery();

    const shoppingLists = lists?.filter(list => list.memberIds?.includes(user.id) || list.allMembers);
    const featuredList = lists?.find(list => list.id === settings?.featuredList.listId);

    // Category grouping and a global max-items cap don't compose meaningfully —
    // with grouping on, "top N" has no coherent ordering across categories
    // (which category gets cut isn't tied to anything the user chose, like
    // sort order does for the flat view). Rather than silently ignore the cap
    // or invent an arbitrary tie-break, the control is disabled while grouping
    // is on. The stored value is left untouched, so it's back in effect the
    // moment grouping is turned off again.
    const categoryGroupsOn = form.values.categoryGroups;

    if (isLoadingShoppingLists) {
        return <Loader size="sm" />
    }

    return (
        <Tabs.Panel value="shopping" style={{ overflowY: "auto", padding: isSmallScreen ? "1.5rem 0.75rem" : "1.75rem 1.25rem", minHeight: 0 }}>
            <SettingsSection title="shopping list">
                <SettingsItem layout="column" label="Featured shopping list" description="Switch which shopping list is featured." divider={true}>
                    <div className={!isSmallScreen ? "tasklist-settings-right" : ""}>
                        {shoppingLists && shoppingLists.length > 0 ? (
                            <Select
                                styles={{
                                    input: {
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }
                                }}
                                w="100%"
                                maw={390}
                                className="truncate-select"
                                clearable
                                placeholder="Pick a shopping list"
                                data={shoppingLists.map(s => ({ value: s.id.toString(), label: s.title }))}
                                value={form.values.listId ? form.values.listId.toString() : null}
                                onChange={(val) => {
                                    form.setFieldValue("listId", val ? Number(val) : null)
                                }}
                            />
                        ) : (
                            <div className="no-tasklists-msg">Whoops! You don't have any shopping lists. Want to <UnstyledButton className="create-tasklist-hint" onClick={() => { handleClose(); openModal() }}>create one</UnstyledButton>?
                            </div>
                        )}
                    </div>
                </SettingsItem>
            </SettingsSection>
            <SettingsSection
                title="display"
            >
                <SettingsItem
                    layout="row" label="Show completed items" description="Keep checked-off items visible" divider={false}
                >
                    <Switch color={featuredList?.color} size="md" withThumbIndicator={false}
                        {...form.getInputProps('showCompleted', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem layout="row" label="Show progress bar" description="Display shopping list progress (completion %)" divider={false}>
                    <Switch
                        color={featuredList?.color}
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('showProgress', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem layout="row" label="Show quick-add bar" description="Display item input field at the bottom" divider={false}>
                    <Switch
                        color={featuredList?.color}
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('showQuickAdd', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <div className="tasklist-settings-section view-tasklist-section">
                    <div className="input-label-description">
                        <Input.Label>View</Input.Label>
                        <Input.Description>Choose preferred view style</Input.Description>
                    </div>
                    <Space h="xs" />
                    <ShoppingViewSelector
                        activeItemDisplay={form.values.view}
                        setActiveItemDisplay={(val: FeaturedShoppingListView | ((prevValue: FeaturedShoppingListView) => FeaturedShoppingListView)) => form.setFieldValue('view', val)}
                        list={featuredList}
                    />
                </div>
                <Divider my="lg" />
            </SettingsSection>
            <SettingsSection title="ordering & limits">
                <SettingsItem layout="column" label="Sort order" description="Set the item order" divider={false}>
                    <Select
                        allowDeselect={false}
                        defaultValue="created"
                        placeholder="Sort by"
                        {...form.getInputProps('sortOrder')}
                        data={[
                            { value: 'created', label: 'By time of creation' },
                            { value: 'alpha', label: 'A - Z' }
                        ]}
                    />
                </SettingsItem>
                <SettingsItem layout="row" label="Group by categories" description="Toggle whether items are grouped by categories" divider={false}>
                    <Switch
                        color={featuredList?.color}
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('categoryGroups', { type: 'checkbox' })}
                    />
                </SettingsItem>
                <SettingsItem
                    layout="column"
                    label="Maximum items shown"
                    description={categoryGroupsOn ? "Not available while grouping by categories is on" : "Cap the number of visible items"}
                    divider={false}
                >
                    <div className={!isSmallScreen ? "tasklist-settings-right" : ""}>
                        <MaxTaskCountPicker
                            list={featuredList}
                            value={form.values.maxItems}
                            onChange={(val) => form.setFieldValue('maxItems', val)}
                            disabled={categoryGroupsOn}
                        />
                    </div>
                </SettingsItem>
            </SettingsSection>
        </Tabs.Panel>
    )

}