import { useNavigate } from "react-router-dom";
import { ActionIcon, Progress, Tooltip } from "@mantine/core";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { type TasklistType } from "@/store/taskSlice";

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
    const navigate = useNavigate();

    return (
        <div className="mobile-tasklist-title-bar">
            <div className="mobile-tasklist-title-bar-top">
                <div className="title-announcements tasklist-announcements">
                    <Tooltip label="Go back">
                        <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white">
                            <ChevronLeftRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                    <span className="title-announcements-title">{tasklist.title}</span>
                </div>
                <Tooltip label="Tasklist settings">
                    <ActionIcon
                        onClick={() => setShowTasklistSettings(true)}
                        className="tasklist-settings-btn"
                        size="compact-md"
                        variant="transparent"
                        color="white"
                    >
                        <SettingsRoundedIcon />
                    </ActionIcon>
                </Tooltip>
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