import { ActionIcon, Tabs, Tooltip } from "@mantine/core"
import { useState, type JSX, type ReactElement, type ReactNode } from "react";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { FeaturedListSettings } from "../FeaturedListSettings/FeaturedListSettings";
import { useAuthenticateQuery } from "@/store";

type Props = {
    tabs: string[];
    tabColor: string;
    defaultTab: string;
    featuredListSettings?: ReactElement;
    children: ReactNode;
}

type TabsObject = {
    tasks: { value: "tasks"; body: JSX.Element };
    shopping: { value: "shopping"; body: JSX.Element };
}

export const HomepageCollapseCardTabs = ({ tabs, tabColor, defaultTab, featuredListSettings, children }: Props) => {
    return (
        <div className="homepage-collapse-card-tabs-container">
            <Tabs
                defaultValue={defaultTab}
            >
                <Tabs.List className="homepage-collapse-card-tabs">
                    <div style={{ display: "flex" }}>
                        {(tabs).map((tab) => <Tabs.Tab color={tabColor} className="homepage-collapse-card-tab" value={tab}>{tab}</Tabs.Tab>)}
                    </div>
                    {featuredListSettings && featuredListSettings}
                </Tabs.List>

                {children}
                {/* {Object.values(tabs).map((tab) => <HomepageCollapseCardTab value={tab.value}>{tab.body}</HomepageCollapseCardTab>)} */}
            </Tabs>
        </div>
    )
}