import { useNavigate } from "react-router-dom";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetTasklistsQuery } from "@/store/taskSlice";
import { ActionIcon, Avatar, Center, Loader, Tooltip } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import dayjs from "dayjs";
import { ArchivedHouseholdTasklistsPage } from "@/pages/ArchivedHouseholdTasklistsPage";
import { ArchivedHouseholdTasklistsMenu } from "./ArchivedHouseholdTasklistsMenu";

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

    const rows = archivedLists?.map(list => <div className="archived-household-tasklists-item">
        <div className="archived-household-tasklists-item-top">
            <div className="archived-household-tasklists-item-title">{list.title}</div>
            <div className="archived-table-btns">
                <ArchivedHouseholdTasklistsMenu tasklistId={list.id} />
            </div>
        </div>
        <div className="archived-household-tasklists-item-bottom">
            <div className="archived-household-tasklists-item-data"><span>Archived on:</span> {dayjs(list.createdAt).format("MMM DD, YYYY")}</div>
            <div className="archived-household-tasklists-item-data">
                <span>Archived by:</span>
                <Tooltip events={{ hover: true, focus: true, touch: true }} withArrow label={list.archivedBy?.firstName}>
                    <Avatar
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                window.open(`/users/${list.archivedBy?.id}`, "_blank")
                            }
                        }}
                        onClick={() => window.open(`/users/${list.archivedBy?.id}`, "_blank")}
                        tabIndex={0}
                        size="xs"
                        src={list.archivedBy?.profileImg || undefined}
                    />
                </Tooltip>
            </div>
        </div>
    </div>)

    // Handle the loading state while waiting for user/lists
    if (!userLoaded || isLoading) return <Center h="100vh"><Loader color="cyan" style={{
        transition: 'opacity 200ms ease-in',
        opacity: isLoading ? 1 : 0,
        transitionDelay: '300ms' // Only starts appearing after 300ms
    }} /></Center>;

    return (
        <div className="archived-household-tasklists-container">
            {archivedLists?.length === 0 ? <Center h="50vh">You haven't archived any tasklists.</Center> : rows}
        </div>
    )
}