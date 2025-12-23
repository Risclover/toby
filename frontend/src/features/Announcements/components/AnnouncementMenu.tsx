import { useToggleAnnouncementImportanceMutation } from "@/store/announcementSlice"

type Props = {
    announcement: {
        id: number;
        householdId: number;
        isImportant: boolean;
    };
    onCloseMenu: () => void;
    ref: React.RefObject<HTMLDivElement>;
}

export const AnnouncementMenu = ({ ref, announcement, onCloseMenu }: Props) => {
    const [toggleImportance] = useToggleAnnouncementImportanceMutation();

    const handleToggleImportance = async () => {
        await toggleImportance({
            announcementId: announcement.id,
            isImportant: !announcement.isImportant,
            householdId: announcement.householdId,
        });
        onCloseMenu();
    }

    return (
        <div className="announcement-menu" ref={ref}>
            <button onClick={handleToggleImportance}>{announcement.isImportant ? "Remove importance" : "Mark important"}</button>
            <button>Delete</button>
        </div>
    )
}