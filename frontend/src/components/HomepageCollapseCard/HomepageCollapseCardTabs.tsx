import { ActionIcon, Tabs, Tooltip } from "@mantine/core"
import type { JSX, ReactNode } from "react";
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

type Props = {
    tabs: TabsObject;
    tabColor: string;
    children: ReactNode;
}

type TabsObject = {
    tasks: { value: "tasks"; body: JSX.Element };
    shopping: { value: "shopping"; body: JSX.Element };
}

export const HomepageCollapseCardTabs = ({ tabs, tabColor, children }: Props) => {
    return (
        <div className="homepage-collapse-card-tabs-container">
            <Tabs
                defaultValue="tasks"
            >
                <Tabs.List className="homepage-collapse-card-tabs">
                    <div style={{ display: "flex" }}>
                        {Object.values(tabs).map((tab) => <Tabs.Tab color={tabColor} className="homepage-collapse-card-tab" value={tab.value}>{tab.value}</Tabs.Tab>)}
                    </div>
                    <Tooltip label="Featured list settings">
                        <ActionIcon
                            // onClick={() => setShowTasklistSettings(true)}
                            size="sm"
                            variant="subtle"
                            color="cyan.6"
                        >
                            <SettingsRoundedIcon fontSize="small" />
                        </ActionIcon>
                    </Tooltip>
                </Tabs.List>

                {children}
                {/* {Object.values(tabs).map((tab) => <HomepageCollapseCardTab value={tab.value}>{tab.body}</HomepageCollapseCardTab>)} */}
            </Tabs>
        </div>
    )
}