import { Tabs } from "@mantine/core"
import type { ReactNode } from "react";

export const HomepageCollapseCardTab = ({ value, children }: { value: string; children: ReactNode }) => {
    return (
        <Tabs.Panel value={value}>{children}</Tabs.Panel>
    )
}