import { useNavigate } from "react-router-dom";
import { useCalendar } from "@/contexts";
import { toDateString } from "@/features";
import { HomepageCollapseCardFooter } from "@/components/HomepageCollapseCard/HomepageCollapseCardFooter";

export const UpcomingFooter = () => {
    const navigate = useNavigate();
    const { modals } = useCalendar();

    return (
        <HomepageCollapseCardFooter
            color="var(--primary)"
            addBtnText="+ New event"
            addBtnOnClick={() => modals.createForDay(toDateString())}
            viewAllBtnOnClick={() => navigate("/calendar")}
        />
    );
};