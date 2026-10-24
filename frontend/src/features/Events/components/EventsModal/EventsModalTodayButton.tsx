import { ActionIcon, Button, Tooltip } from "@mantine/core";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";

type Props = {
    /** Shows an icon button instead of a labelled one */
    isSmallScreen: boolean;
    onClick: () => void;
};

const BUTTON_PADDING = ".5rem 1rem";

export const EventsModalTodayButton = ({ isSmallScreen, onClick }: Props) => (
    <Tooltip label="Jump to today" withArrow>

        <Button
            onClick={onClick}
            radius="sm"
            size="sm"
            color="navy"
            variant="filled"
            p={BUTTON_PADDING}
            h="auto"
            fw={500}
        >
            Today
        </Button>

    </Tooltip>
);