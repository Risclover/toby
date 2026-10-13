import { useState } from "react";

import { useIsSmallScreen } from "@/hooks";
import type { DayEventRowSharedProps } from "../types";

type Props = Pick<DayEventRowSharedProps, "openDotId" | "onOpenDot"> & {
    dotId: string;
};

const SMALL_SCREEN_MAX_WIDTH = 475;

export function useAttendeeDot({ dotId, openDotId, onOpenDot }: Props) {
    const isSmallScreen = useIsSmallScreen(SMALL_SCREEN_MAX_WIDTH);
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