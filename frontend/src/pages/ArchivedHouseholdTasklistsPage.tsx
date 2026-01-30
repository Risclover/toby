import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/layout/MobileLayout"
import { MobileTasklistHeader } from "@/features/HouseholdTasklists/components/MobileTasklists/MobileTasklistHeader";
import { ArchivedHouseholdTasklists } from "@/features/HouseholdTasklists/components/ArchivedHouseholdTasklists/ArchivedHouseholdTasklists";
import { ActionIcon, Tooltip } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

export const ArchivedHouseholdTasklistsPage = () => {
    const navigate = useNavigate();

    const titleComponent = (
        <div className='mobile-home-family-title'>
            <div className="title-announcements">
                <Tooltip label="Go back">
                    <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white">
                        <ChevronLeftRoundedIcon />
                    </ActionIcon></Tooltip>
                <h1>Archived Lists</h1>
            </div>
        </div>
    );

    return (
        <MobileLayout titleComponent={titleComponent}>
            {/* <MobileTasklistHeader /> */}
            <ArchivedHouseholdTasklists />
        </MobileLayout>
    );
}
