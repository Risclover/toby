import { MobileLayout } from "@/layout/MobileLayout"
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTasklistsQuery } from "@/store/taskSlice"
import { ActionIcon, Divider, Table, Tooltip } from "@mantine/core";
import dayjs from 'dayjs';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useNavigate } from "react-router-dom";
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import { MobileTasklistHeader } from "@/features/HouseholdTasklists/components/MobileTasklists/MobileTasklistHeader";
export const ArchivedHouseholdTasklists = () => {
    const navigate = useNavigate();
    const { data: user, isSuccess: userLoaded } = useAuthenticateQuery();

    const { data: archivedLists, isLoading } = useGetTasklistsQuery(
        {
            householdId: Number(user?.householdId),
            isArchived: true
        },
        {
            // 🚀 Only run this query if we actually have a householdId
            skip: !user?.householdId
        }
    );

    console.log('Archived lists:', archivedLists);

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

    const rows = archivedLists?.map(list => <div className="archived-household-tasklists-item">
        <div className="archived-household-tasklists-item-top">
            <div className="archived-household-tasklists-item-title">{list.title}</div>
            <div className="archived-table-btns">
                <ActionIcon variant="subtle" color="rgb(5, 5, 73)" size='xs'><MoreVertRoundedIcon /></ActionIcon>
            </div>
        </div>
        <div className="archived-household-tasklists-item-bottom">
            <div className="archived-household-tasklists-item-data"><span>Archived on:</span> {dayjs(list.createdAt).format("MMM DD, YYYY")}</div>
            <div className="archived-household-tasklists-item-data"><span>Archived by:</span> {list.archivedBy?.firstName}</div>
        </div>
    </div>)

    // Handle the loading state while waiting for user/lists
    if (!userLoaded || isLoading) return <p>Loading...</p>;

    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileTasklistHeader />
            <div className="archived-household-tasklists-container">
                {rows}
            </div>
        </MobileLayout>
    );
}
