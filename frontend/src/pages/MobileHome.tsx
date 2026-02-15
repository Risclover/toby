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
import { useState } from "react";
import { useAuthenticateQuery, useUpdateTimezoneMutation } from "@/store";
import { Button } from "@mantine/core";

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
        // <div className="mobile-home-container">
        //     <div className="mobile-home-container-top">
        //         <MobileHeader />
        //         <MobileHomeFamilyTitle />
        //     </div>
        //     <div className="mobile-home-container-bottom">
        //         <MobileHomeNavGrid />
        //         {/* <MobileHomeCheckinReminder /> */}
        //         {/* <MobileHomeCalendar /> */}
        //         <MobileHomeNoticeBoard />
        //         {/* <MobileHomeDailyCheckins />
        //         <MobileHomeRecentActivity /> */}
        //     </div>
        // </div>
        <MobileLayout titleComponent={mobileHomeFamilyTitle}>
            <MobileHomeNavGrid />
            <TimezoneSelect value={timezone} onChange={(tz) => setTimezone(tz)} />
            <Button onClick={handleTimezone}>Submit</Button>
            <TaskStatusSection />
            <MobileHomeNoticeBoard />
        </MobileLayout>
    )
}