import { MobileHomeFamilyTitle } from "@/components/MobileHomeFamilyTitle"
import "@/assets/styles/mobile.css";
import { MobileHomeNavGrid } from "@/components/MobileHomeNavGrid";
import { MobileLayout } from "@/layout/MobileLayout";
import { TaskStatusSection } from "@/components/DueTaskStats/TaskStatusSelection";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { useState } from "react";
import { useAuthenticateQuery, useUpdateTimezoneMutation } from "@/store";
import { Button } from "@mantine/core";
import { HomepageListsCollapseCard } from "@/components/HomepageCollapseCard/HomepageListsCollapseCard";
import { HomepageNoticeBoardCollapseCard } from "@/components/HomepageCollapseCard/HomepageNoticeBoardCollapseCard";
import { HomepageCheckinsCollapseCard } from "@/components/HomepageCollapseCard/HomepageCheckinsCollapseCard";
import { HomepageActivityCollapseCard } from "@/components/HomepageCollapseCard/HouseholdActivityCollapseCard";

export const MobileHome = () => {
    const mobileHomeFamilyTitle = <MobileHomeFamilyTitle />
    const { data: user } = useAuthenticateQuery();
    const [updateTimezone] = useUpdateTimezoneMutation();
    const [timezone, setTimezone] = useState(user?.timezone || null);

    const handleTimezone = async () => {
        const data = await updateTimezone(timezone);
        console.log('data:', data);
    }


    return (
        <MobileLayout titleComponent={mobileHomeFamilyTitle}>
            <MobileHomeNavGrid />
            <TimezoneSelect value={timezone} onChange={(tz) => setTimezone(tz)} />
            <Button onClick={handleTimezone}>Submit</Button>
            <TaskStatusSection />
            <HomepageNoticeBoardCollapseCard />
            <HomepageListsCollapseCard />
            <HomepageCheckinsCollapseCard />
            <HomepageActivityCollapseCard />
        </MobileLayout>
    )
}