import { useState } from "react";

import { useIsSmallScreen } from "@/hooks";
import type { DayEventRowSharedProps } from "../types";
import { EVENTS_MODAL_SMALL_SCREEN_WIDTH } from "../utils/eventsModalConstants";

type Props = Pick<DayEventRowSharedProps, "openDotId" | "onOpenDot"> & {
    dotId: string;
};

const isSmallScreen = useIsSmallScreen(EVENTS_MODAL_SMALL_SCREEN_WIDTH);

export function useAttendeeDot({ dotId, openDotId, onOpenDot }: Props) {
    const isSmallScreen = useIsSmallScreen(EVENTS_MODAL_SMALL_SCREEN_WIDTH);
    const [localOpened, setLocalOpened] = useState(false);

    const opened = isSmallScreen ? openDotId === dotId : localOpened;

    const setOpened = (value: boolean) => {
        if (!isSmallScreen) {
            setLocalOpened(value);
            return;
        }
        if (value) onOpenDot(dotId);
    };

    return { opened, setOpened };
}