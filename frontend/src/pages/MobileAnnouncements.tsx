import { MobileAnnouncementsFull } from "@/component/MobileAnnouncementsFull";
import { MobileAnnouncementsHeader } from "@/component/MobileAnnouncementsHeader";
import { MobileLayout } from "@/layout/MobileLayout"
import { Button } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";
export const MobileAnnouncements = () => {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState("");
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [sortOption, setSortOption] = useState<null | "Newest" | "Oldest" | "Important first">(null);
    const [filters, setFilters] = useState({
        importance: "all" as "all" | "important",
        creatorId: null as number | null,
        time: "all" as "today" | "7days" | "30days" | "all",
    });
    const title = <div className="mobile-home-family-title">
        <div className="title-announcements">
            <Button size="compact-xs" radius="xl" variant="subtle" color="white" onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></Button>
            Announcements
        </div>
        <Button
            className="add-announcement" size="compact-md" variant="filled" color="white"
            w={30}
            h={30}
            p={0}
            onClick={() => setShowCreateAnnouncement(true)}
        >
            <AddRoundedIcon fontSize="small" />
        </Button>
    </div >
    return (
        <MobileLayout titleComponent={title}>
            <MobileAnnouncementsHeader searchValue={searchValue} setSearchValue={setSearchValue} sortOption={sortOption} setSortOption={setSortOption} filters={filters} setFilters={setFilters} />
            <MobileAnnouncementsFull searchValue={searchValue} sortOption={sortOption} filters={filters} />
            {showCreateAnnouncement && <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />}
        </MobileLayout>
    )
}