import { useNavigate } from "react-router-dom";
import { ActionIcon, Progress, Title, Tooltip } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { type TasklistType } from "@/store/taskSlice";
import { useIsSmallScreen } from "@/hooks";
import { SettingsIcon } from "@/assets/icons/SettingsIcon";
import { useAuthenticateQuery } from "@/store";
import { useHousehold } from "@/hooks/useHousehold";


interface TitleComponentProps {
    percent: number;
    tasklist: TasklistType;
    setShowTasklistSettings: (val: boolean) => void;
}

export const MobileTasklistTitleComponent = ({
    percent,
    tasklist,
    setShowTasklistSettings
}: TitleComponentProps) => {
    const isSmall = useIsSmallScreen(425);
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();

    const handleSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (tasklist.isArchived) return;
        setShowTasklistSettings(true);
    }
    return (
        <div className="mobile-tasklist-title-bar">
            <div className="mobile-tasklist-title-bar-top">
                <div className="title-announcements tasklist-announcements">
                    <Tooltip withArrow label="Go back">
                        <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white">
                            <ChevronLeftRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                    <Title order={1} lineClamp={1} className={`title-announcements-title${isSmall ? " smaller-header" : ""}`}>{tasklist.title}</Title>
                </div>
                {(user.id === household?.adminId || user.id === tasklist.creatorId) &&
                    <Tooltip withArrow label={`Tasklist settings${tasklist.isArchived ? " (disabled while archived)" : ""}`}>
                        <ActionIcon
                            onClick={handleSettingsClick}
                            className={`tasklist-settings-btn${tasklist.isArchived ? " list-archived" : ""}`}
                            size="md"
                            variant="transparent"
                            radius="xl"
                            color="white"
                        >
                            <SettingsRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                }
            </div>
            <div className="progress">
                <div className="progress-left">
                    <Progress color="var(--tasklist-color)" value={percent} />
                </div>
                {percent}%
            </div>
        </div>
    );
};