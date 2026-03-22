import { StarIcon } from "@/assets/icons/StarIcon"
import { useHousehold } from "@/hooks/useHousehold";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useGetTasklistQuery, type TasklistType } from "@/store/taskSlice";
import { ActionIcon, Avatar, Progress } from "@mantine/core"
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

export const Tasklist = ({ list }: { list: TasklistType }) => {
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { data: tasklist } = useGetTasklistQuery(list.id)

    const nameOf = (p: any) => p?.displayName || p?.name || "Member";
    const avatarInitial = (p: any) =>
        (p?.displayName?.[0] || p?.name?.[0] || "?").toUpperCase();

    return (
        <div className="tasklist-card">
            <div className="tasklist-top-card">
                <div className="mobile-tasklist-card-header">
                    <div className="mobile-tasklist-card-header-top">
                        <h2>Tasklist Title</h2>
                        <div className="mobile-tasklist-card-header-top header-right">
                            <ActionIcon color="cyan" variant="subtle" radius="xl" size="compact-xs">
                                <StarIcon size="20px" />
                            </ActionIcon>
                            <ActionIcon color="var(--mantine-color-gray-6)" variant="subtle" size="compact-xs">
                                <MoreVertRoundedIcon fontSize="small" />
                            </ActionIcon>
                        </div>
                    </div>
                    <div className="progress">
                        <div className="progress-left">
                            <Progress value={50} color="cyan" />
                        </div>
                        <span className="progress-value">50%</span>
                    </div>
                </div>
                <div className="mobile-tasklist-card-body">
                    <ul>
                        <li>
                            8 tasks
                            <ul className="tasks-list dashed">
                                <li>4 overdue</li>
                                <li>2 due today</li>
                                <li>4 due soon</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="mobile-tasklist-card-footer">
                <Avatar.Group>
                    <Avatar
                        tabIndex={0}
                        src={user.profileImg || undefined}
                        radius="xl"
                        size="sm"
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" || e.key === " ") {
                                window.open(`/profile/${user.id}`, "_blank")
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/profile/${user.id}`, "_blank")
                        }}
                    >
                        {!user.profileImg && avatarInitial(user)}
                    </Avatar>
                    <Avatar
                        tabIndex={0}
                        src={user.profileImg || undefined}
                        radius="xl"
                        size="sm"
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" || e.key === " ") {
                                window.open(`/profile/${user.id}`, "_blank")
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/profile/${user.id}`, "_blank")
                        }}
                    >
                        {!user.profileImg && avatarInitial(user)}
                    </Avatar>
                    <Avatar className="clickable-avatar" radius="xl" size="sm" style={{ fontSize: "3rem" }}>
                        +1
                    </Avatar>
                </Avatar.Group>
            </div>
        </div>
    )
}