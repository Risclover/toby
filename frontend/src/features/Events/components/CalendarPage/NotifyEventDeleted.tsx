import { Text } from "@mantine/core";

import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

export const NotifyEventDeleted = (title: string) =>
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