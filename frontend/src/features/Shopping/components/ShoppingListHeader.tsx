import { ActionIcon, Tooltip } from "@mantine/core";
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';

export const ShoppingListHeader = () => {
    return (
        <div className="shopping-list-header">
            <div className="shopping-list-header--right"></div>
            <div className="shopping-list-header--left">
                <Tooltip.Group openDelay={500} closeDelay={100}>
                    <Tooltip withArrow label="Categories">
                        <ActionIcon
                            variant="subtle"
                            color="rgb(5, 5, 73)"
                        >
                            <CategoryRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withArrow label="Filter list">
                        <ActionIcon variant="subtle" color="rgb(5, 5, 73)">
                            <FilterAltRoundedIcon />
                        </ActionIcon>
                    </Tooltip>
                </Tooltip.Group>
            </div>
        </div>
    )
}