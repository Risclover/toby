import { MobileAnnouncementsFull } from "@/component/MobileAnnouncementsFull";
import { MobileAnnouncementsHeader } from "@/component/MobileAnnouncementsHeader";
import { MobileLayout } from "@/layout/MobileLayout"
import { ActionIcon, Button } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

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
            <h1>Announcements</h1>
        </div>
        <ActionIcon
            className="add-announcement" size="lg" radius="md" variant="filled" color="white" c="rgb(5, 5, 73)"
            onClick={() => setShowCreateAnnouncement(true)}
        >
            <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
        </ActionIcon>
    </div >
    return (
        <MobileLayout titleComponent={title}>
            <MobileAnnouncementsHeader searchValue={searchValue} setSearchValue={setSearchValue} sortOption={sortOption} setSortOption={setSortOption} filters={filters} setFilters={setFilters} />
            <MobileAnnouncementsFull searchValue={searchValue} sortOption={sortOption} filters={filters} />
            {showCreateAnnouncement && <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />}
        </MobileLayout>
    )
}