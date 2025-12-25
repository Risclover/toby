import { MobileAnnouncementsFull } from "@/component/MobileAnnouncementsFull";
import { MobileAnnouncementsHeader } from "@/component/MobileAnnouncementsHeader";
import { MobileLayout } from "@/layout/MobileLayout"
import { Button } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const MobileAnnouncements = () => {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState("");
    const [sortOption, setSortOption] = useState<null | "Newest" | "Oldest" | "Important first">(null);

    const title = <div className="mobile-home-family-title title-announcements">
        <Button size="compact-xs" radius="xl" variant="subtle" color="white" onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></Button>
        Announcements
    </div>
    return (
        <MobileLayout titleComponent={title}>
            <MobileAnnouncementsHeader searchValue={searchValue} setSearchValue={setSearchValue} sortOption={sortOption} setSortOption={setSortOption} />
            <MobileAnnouncementsFull searchValue={searchValue} sortOption={sortOption} />
        </MobileLayout>
    )
}