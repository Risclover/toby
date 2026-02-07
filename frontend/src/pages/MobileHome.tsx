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

export const MobileHome = () => {
    const mobileHomeFamilyTitle = <MobileHomeFamilyTitle />

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
            <TaskStatusSection />
            <MobileHomeNoticeBoard />
        </MobileLayout>
    )
}