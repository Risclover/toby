import { useState, type JSX } from "react";
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { HomepageCollapseCardTabs } from "./HomepageCollapseCardTabs"
import { HomepageCollapseCardTab } from "./HomepageCollapseCardTab";
import { HomepageListsTasklist } from "./HomepageListsTasklist";
import { FeaturedListSettings } from "../FeaturedListSettings/FeaturedListSettings";
import { useAuthenticateQuery } from "@/store";
import { ActionIcon, Tooltip } from "@mantine/core";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

export const HomepageListsCollapseCard = () => {
    const { data: user } = useAuthenticateQuery();
    const tabs = ["tasks", "shopping"]
    const [showFeaturedListSettings, setShowFeaturedListSettings] = useState(false);

    const featuredListSettings = <Tooltip label="Featured list settings" openDelay={500} withArrow>
        <ActionIcon
            // onClick={() => setShowTasklistSettings(true)}
            size="sm"
            variant="subtle"
            color="cyan.6"
            onClick={() => setShowFeaturedListSettings(true)}
        >
            <SettingsRoundedIcon fontSize="small" />
        </ActionIcon>
    </Tooltip>

    return (
        <HomepageCollapseCard cardKey="lists" title="lists" color="var(--mantine-color-cyan-6)">
            <HomepageCollapseCardTabs
                tabs={tabs}
                tabColor="var(--mantine-color-cyan-6)"
                defaultTab="tasks"
                featuredListSettings={featuredListSettings}
            >
                <HomepageCollapseCardTab value="tasks">
                    <HomepageListsTasklist />
                </HomepageCollapseCardTab>
                <HomepageCollapseCardTab value="shopping">
                    Shopping
                </HomepageCollapseCardTab>
            </HomepageCollapseCardTabs>
            {showFeaturedListSettings && <FeaturedListSettings key={`${user?.featuredTasklistId}`} opened={showFeaturedListSettings} setShowFeaturedListSettings={setShowFeaturedListSettings} />}
        </HomepageCollapseCard>
    )
}