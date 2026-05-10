import { ActionIcon, Tooltip } from '@mantine/core';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import type { JSX } from 'react';

type Props = {
    tooltipLabel: string | JSX.Element;
    tooltipWidth?: number;
}

export const InfoTooltip = ({ tooltipLabel, tooltipWidth }: Props) => {
    return (
        <Tooltip maw={tooltipWidth} multiline events={{ hover: true, focus: true, touch: true }} label={tooltipLabel} withArrow radius="md" transitionProps={{ duration: 200 }}>
            <ActionIcon miw="20px" mih="20px" w={0} p={0} h="auto" radius="xl" className="featured-info-icon" variant="transparent" color="transparent">
                <HelpOutlineRoundedIcon />
            </ActionIcon>
        </Tooltip>
    )
}