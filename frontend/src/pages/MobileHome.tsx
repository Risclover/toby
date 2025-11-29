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
            <div className="mobile-home-container-top">
                <MobileHeader />
                <MobileHomeFamilyTitle />
            </div>
            <div className="mobile-home-container-bottom">
                <MobileHomeNavGrid />
                {/* <MobileHomeCheckinReminder /> */}
                {/* <MobileHomeCalendar /> */}
                <MobileHomeNoticeBoard />
                {/* <MobileHomeDailyCheckins />
                <MobileHomeRecentActivity /> */}
            </div>
        </div>
    )
}