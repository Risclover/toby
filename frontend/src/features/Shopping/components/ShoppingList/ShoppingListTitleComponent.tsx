import { ActionIcon, Combobox, Progress, Title, Tooltip } from "@mantine/core"
import { useNavigate } from "react-router-dom"
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useAuthenticateQuery, type ShoppingList } from "@/store";
import { useIsSmallScreen } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { getLightColor } from "@/utils";
import { useShoppingList } from "../../hooks/useShoppingList";

type Props = {
    list: ShoppingList;
}

export const ShoppingListTitleComponent = ({ list }: Props) => {
    const navigate = useNavigate();
    const isSmall = useIsSmallScreen(425);
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const { percent } = useShoppingList({ items: list.items });

    const handleSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (list.isArchived) return;
        // setShowTasklistSettings(true);
    }

    return (
        <div className="shopping-list-title-bar">
            <div className="shopping-list-title-bar--top">
                <div className="shopping-list-title-bar--left">
                    <Tooltip withArrow label="Back to shopping lists">
                        <ActionIcon onClick={() => navigate("/shopping")} variant="subtle" color="white">
                            <ChevronLeftRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                    <Title order={1} lineClamp={1} className={`shopping-list-title${isSmall ? " smaller-header" : ""}`}>{list.title}</Title>
                </div>
                {(user.id === household?.adminId || user.id === list.creatorId) &&
                    <Tooltip withArrow label={`List settings${list.isArchived ? " (disabled while archived)" : ""}`}>
                        <ActionIcon className={`shopping-list-settings-btn${list.isArchived ? " list-archived" : ""}`} size="md" variant="transparent" radius="xl" color="white">
                            <SettingsRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                }
            </div>
            <div className="progress">
                <div className="progress-left">
                    <Progress color={list.color} value={percent} />
                </div>
                {percent}%
            </div>
        </div>
    )
}