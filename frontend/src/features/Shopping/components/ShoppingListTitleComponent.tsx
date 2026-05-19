import { ActionIcon, Combobox, Progress, Title, Tooltip } from "@mantine/core"
import { useNavigate } from "react-router-dom"
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useAuthenticateQuery, type ShoppingList } from "@/store";
import { useIsSmallScreen } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { getLightColor } from "@/utils";

type Props = {
    list: ShoppingList;
}

export const ShoppingListTitleComponent = ({ list }: Props) => {
    const navigate = useNavigate();
    const isSmall = useIsSmallScreen(425);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();

    if (!list) return null;
    return (
        <div className="shopping-list-title-bar">
            <div className="shopping-list-title-bar--top">
                <div className="shopping-list-title-bar--left">
                    <Tooltip withArrow label="Go back">
                        <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white"><ChevronLeftRoundedIcon /></ActionIcon>
                    </Tooltip>
                    <Title order={1} lineClamp={1} className={`shopping-list-title${isSmall ? " smaller-header" : ""}`}>{list.title}</Title>
                </div>
                {(user.id === household?.adminId || user.id === list.creatorId) && <Tooltip withArrow label="Shopping list settings">
                    <ActionIcon className="shopping-list-settings-btn" size="md" variant="transparent" radius="xl" color="white">
                        <SettingsRoundedIcon /></ActionIcon></Tooltip>}
            </div>
            <div className="progress">
                <div className="progress-left">
                    <Progress color={getLightColor("#050549", .5)} value={50} />
                </div>
                100%
            </div>
        </div>
    )
}