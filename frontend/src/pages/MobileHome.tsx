import { MobileHomeFamilyTitle } from "@/component/MobileHomeFamilyTitle"
import { MobileHeader } from "@/component/MobileHomeHeader"
import "@/assets/styles/mobile.css";
import { MobileHomeCalendar } from "@/component/MobileHomeCalendar";
import { MobileHomeCheckinReminder } from "@/component/MobileHomeCheckinReminder";
import { MobileHomeNavGrid } from "@/component/MobileHomeNavGrid";
import { MobileHomeNoticeBoard } from "@/component/MobileHomeNoticeBoard";
import { MobileHomeDailyCheckins } from "@/component/MobileHomeDailyCheckins";
import { MobileHomeRecentActivity } from "@/component/MobileHomeRecentActivity";

export const MobileHome = () => {
    return (
        <div className="mobile-home-container">
            <MobileHeader />
            <div className="mobile-home-container-top">
                <MobileHomeNavGrid />
                <MobileHomeFamilyTitle />
                <MobileHomeCheckinReminder />
                {/* <MobileHomeCalendar /> */}
                <MobileHomeNoticeBoard />
            </div>
            <div className="mobile-home-container-bottom">
                <MobileHomeDailyCheckins />
                <MobileHomeRecentActivity />
            </div>
        </div>
    )
}