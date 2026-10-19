import { KittyNotification } from "@/components";
import { KittyIcons } from "@/assets";

const FALLBACK_TITLE = "That event";
const TITLE_STYLE = { fontWeight: 500 } as const;

export const NotifyEventDeleteFailed = (eventTitle: string = FALLBACK_TITLE) =>
    KittyNotification({
        title: "Delete didn't stick",
        message: (
            <>
                Yikes - "<strong style={TITLE_STYLE}>{eventTitle}</strong>" wouldn't let go. Nothing
                was deleted, so give it another go in a moment. Even gators miss a snap sometimes.
            </>
        ),
        color: "red",
        icon: KittyIcons.Huggy,
    });