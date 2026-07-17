import { useNavigate } from "react-router-dom";
import { ActionIcon, Tooltip } from "@mantine/core";
import { MobileLayout } from "@/layout/MobileLayout"
import { ArchivedHouseholdTasklists } from "@/features/HouseholdTasklists/components/ArchivedHouseholdTasklists/ArchivedHouseholdTasklists";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

export const ArchivedHouseholdTasklistsPage = () => {
    const navigate = useNavigate();

    const titleComponent = (
        <div className='mobile-home-family-title'>
            <div className="title-announcements">
                <Tooltip withArrow label="Go back">
                    <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white">
                        <ChevronLeftRoundedIcon />
                    </ActionIcon></Tooltip>
                <h1>Archived Tasklists</h1>
            </div>
        </div>
    );

    return (
        <MobileLayout titleComponent={titleComponent}>
            <div className="shopping-list-header"></div>
            <ArchivedHouseholdTasklists />
        </MobileLayout>
    );
}
