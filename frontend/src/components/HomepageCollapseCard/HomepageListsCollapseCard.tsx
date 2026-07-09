import { useState, type JSX } from "react";
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { HomepageCollapseCardTabs } from "./HomepageCollapseCardTabs"
import { HomepageCollapseCardTab } from "./HomepageCollapseCardTab";
import { HomepageListsTasklist } from "./HomepageListsTasklist";
import { FeaturedListSettings } from "../FeaturedListSettings/FeaturedListSettings";
import { useAuthenticateQuery } from "@/store";
import { ActionIcon, Tooltip } from "@mantine/core";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { HomepageListsShoppingList } from "./HomepageListsShoppingList/HomepageListsShoppingList";

export const HomepageListsCollapseCard = ({ isReady }: { isReady: boolean }) => {
    const { data: user } = useAuthenticateQuery();
    const tabs = ["tasks", "shopping"]
    const [showFeaturedListSettings, setShowFeaturedListSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>("tasks");

    const handleGearClick = () => {
        setShowFeaturedListSettings(true);
    }

    const featuredListSettings = <Tooltip label="Featured list settings" openDelay={500} withArrow>
        <ActionIcon
            // onClick={() => setShowTasklistSettings(true)}
            size="sm"
            variant="subtle"
            color="cyan.6"
            onClick={handleGearClick}
        >
            <SettingsRoundedIcon fontSize="small" />
        </ActionIcon>
    </Tooltip>

    return (
        <HomepageCollapseCard cardKey="lists" title="lists" color="var(--mantine-color-cyan-6)" scrollSelector=".homepage-lists-tasklist">
            <HomepageCollapseCardTabs
                tabs={tabs}
                tabColor="var(--mantine-color-cyan-6)"
                defaultTab="tasks"
                featuredListSettings={featuredListSettings}
                setActiveTab={setActiveTab}
                onTabChange={(value) => {
                    if (value === "shopping") {
                        setActiveTab("shopping");
                    } else {
                        setActiveTab("tasks")
                    }
                }}
            >
                <HomepageCollapseCardTab value="tasks">
                    <HomepageListsTasklist isReady={isReady} />
                </HomepageCollapseCardTab>
                <HomepageCollapseCardTab value="shopping">
                    <HomepageListsShoppingList isReady={isReady} />
                </HomepageCollapseCardTab>
            </HomepageCollapseCardTabs>
            {showFeaturedListSettings && <FeaturedListSettings activeTab={activeTab} setActiveTab={setActiveTab} key={`${user?.tasklistId}`} opened={showFeaturedListSettings} setShowFeaturedListSettings={setShowFeaturedListSettings} />}
        </HomepageCollapseCard>
    )
}