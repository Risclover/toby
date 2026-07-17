import { MobileLayout } from "@/layout"
import { ActionIcon, Tooltip } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { ArchivedShoppingLists } from "@/features/Shopping/components/ArchivedShoppingLists/ArchivedShoppingLists";

export const ArchivedShoppingListsPage = () => {
    const navigate = useNavigate();

    const titleComponent = (
        <div className='mobile-home-family-title'>
            <div className="title-announcements">
                <Tooltip withArrow label="Go back">
                    <ActionIcon onClick={() => navigate(-1)} variant="subtle" color="white">
                        <ChevronLeftRoundedIcon />
                    </ActionIcon></Tooltip>
                <h1>Archived Shopping Lists</h1>
            </div>
        </div>
    );

    return (
        <MobileLayout titleComponent={titleComponent}>
            <div className="shopping-list-header"></div>
            <ArchivedShoppingLists />
        </MobileLayout>
    )
}