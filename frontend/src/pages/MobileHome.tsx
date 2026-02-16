import { MobileHomeFamilyTitle } from "@/components/MobileHomeFamilyTitle"
import { MobileHomeHeader } from "@/components/MobileHomeHeader"
import "@/assets/styles/mobile.css";
import { MobileHomeCalendar } from "@/components/MobileHomeCalendar";
import { MobileHomeCheckinReminder } from "@/components/MobileHomeCheckinReminder";
import { MobileHomeNavGrid } from "@/components/MobileHomeNavGrid";
import { MobileHomeNoticeBoard } from "@/components/MobileHomeNoticeBoard";
import { MobileHomeDailyCheckins } from "@/components/MobileHomeDailyCheckins";
import { MobileHomeRecentActivity } from "@/components/MobileHomeRecentActivity";
import { MobileLayout } from "@/layout/MobileLayout";
import { TaskStatusSection } from "@/components/DueTaskStats/TaskStatusSelection";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { useState, type JSX } from "react";
import { useAuthenticateQuery, useUpdateTimezoneMutation } from "@/store";
import { Button } from "@mantine/core";
import { HomepageCollapseCard } from "@/components/HomepageCollapseCard/HomepageCollapseCard";
import { HomepageCollapseCardBody } from "@/components/HomepageCollapseCard/HomepageCollapseCardBody";
import { HomepageCollapseCardTabs } from "@/components/HomepageCollapseCard/HomepageCollapseCardTabs";
import { HomepageCollapseCardTab } from "@/components/HomepageCollapseCard/HomepageCollapseCardTab";
import { HomepageListsCollapseCard } from "@/components/HomepageCollapseCard/HomepageListsCollapseCard";

export const MobileHome = () => {
    const mobileHomeFamilyTitle = <MobileHomeFamilyTitle />
    const { data: user } = useAuthenticateQuery();
    const [updateTimezone] = useUpdateTimezoneMutation();
    const [timezone, setTimezone] = useState(user?.timezone || null);

    const handleTimezone = async () => {
        const data = await updateTimezone(timezone);
        console.log('data:', data);
    }

    const tabs = {
        "tasks": { value: "tasks", body: <div>Hello</div> },
        "shopping": { value: "shopping", body: <div>goodbye</div> }
    } as const satisfies Record<string, { value: string; body: JSX.Element }>;


    return (
        <MobileLayout titleComponent={mobileHomeFamilyTitle}>
            <MobileHomeNavGrid />
            <TimezoneSelect value={timezone} onChange={(tz) => setTimezone(tz)} />
            <Button onClick={handleTimezone}>Submit</Button>
            <TaskStatusSection />
            <MobileHomeNoticeBoard />
            <HomepageListsCollapseCard />
        </MobileLayout>
    )
}