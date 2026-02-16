import type { JSX } from "react";
import { HomepageCollapseCard } from "./HomepageCollapseCard"
import { HomepageCollapseCardTabs } from "./HomepageCollapseCardTabs"
import { HomepageCollapseCardTab } from "./HomepageCollapseCardTab";
import { HomepageListsTasklist } from "./HomepageListsTasklist";

export const HomepageListsCollapseCard = () => {
    const tabs = {
        "tasks": { value: "tasks", body: <div>Hello</div> },
        "shopping": { value: "shopping", body: <div>goodbye</div> }
    } as const satisfies Record<string, { value: string; body: JSX.Element }>;

    return (
        <HomepageCollapseCard title="lists">
            <HomepageCollapseCardTabs
                tabs={tabs}
                tabColor="var(--mantine-color-cyan-6)"
            >
                <HomepageCollapseCardTab value="tasks">
                    <HomepageListsTasklist />
                </HomepageCollapseCardTab>
                <HomepageCollapseCardTab value="shopping">
                    b
                </HomepageCollapseCardTab>
            </HomepageCollapseCardTabs>
        </HomepageCollapseCard>
    )
}