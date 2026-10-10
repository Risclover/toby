import { Text } from "@mantine/core";

import { KittyIcons } from "@/assets";
import { KittyNotification } from "@/components";

export const notifyEventDeleted = (title: string) =>
    KittyNotification({
        title: "Event deleted",
        message: (
            <>
                Done - "<Text span inherit fw={500}>{title}</Text>" has been removed from your events. Later, gator!
            </>
        ),
        color: "green",
        icon: KittyIcons.Huggy,
    });