import { type ReactElement, type ReactNode } from "react";
import { Tabs } from "@mantine/core"

type Props = {
    tabs: string[];
    tabColor: string;
    defaultTab: string;
    featuredListSettings?: ReactElement;
    children: ReactNode;
    onTabChange?: (value: string | null) => void;
    tabIndicator?: (tab: string) => ReactNode;
}

export const HomepageCollapseCardTabs = ({ tabs, tabColor, defaultTab, featuredListSettings, children, onTabChange, tabIndicator }: Props) => {
    return (
        <div className="homepage-collapse-card-tabs-container">
            <Tabs
                defaultValue={defaultTab}
                onChange={(value) => onTabChange?.(value)}
            >
                <Tabs.List className="homepage-collapse-card-tabs">
                    <div style={{ display: "flex" }}>
                        {tabs.map((tab) => (
                            <Tabs.Tab
                                key={tab}
                                rightSection={tabIndicator?.(tab)}
                                color={tabColor}
                                className="homepage-collapse-card-tab"
                                value={tab}
                            >
                                {tab}
                            </Tabs.Tab>
                        ))}
                    </div>
                    {featuredListSettings && featuredListSettings}
                </Tabs.List>
                {children}
            </Tabs>
        </div>
    )
}