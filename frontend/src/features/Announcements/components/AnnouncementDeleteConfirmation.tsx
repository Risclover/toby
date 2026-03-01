import { useDeleteAnnouncementMutation } from "@/store/announcementSlice";
import { Button, Group, Modal, Space, Text } from "@mantine/core"
import type { SetStateAction } from "react";
import type React from "react";

type Props = {
    announcement: {
        id: number;
        householdId: number;
        message: string;
    }
    openDeleteConfirmation: boolean;
    setOpenDeleteConfirmation: React.Dispatch<SetStateAction<boolean>>
}

export const AnnouncementDeleteConfirmation = ({ announcement, openDeleteConfirmation, setOpenDeleteConfirmation }: Props) => {
    const [deleteAnnouncement] = useDeleteAnnouncementMutation();

    const handleDeleteAnnouncement = async () => {
        await deleteAnnouncement({ announcementId: announcement.id, householdId: announcement.householdId });
        setOpenDeleteConfirmation(false);
    }

    return (
        <Modal centered opened={openDeleteConfirmation} onClose={() => setOpenDeleteConfirmation(false)} title="Delete announcement?">
            <Text size="sm">Are you sure you want to delete this announcement? This action cannot be undone.</Text>
            <Space h="md" />
            <Group justify="flex-end">
                <Button
                    onClick={() => setOpenDeleteConfirmation(false)}
                    color="cyan.5"
                    size="compact-sm"
                    variant="subtle"
                    radius="xl"
                // styles={{ label: { fontWeight: "400" } }}
                >
                    Cancel
                </Button>
                <Button
                    color="red"
                    size="compact-sm"
                    onClick={handleDeleteAnnouncement}
                    radius="xl"
                // styles={{ label: { fontWeight: "400" } }}
                >
                    Confirm
                </Button>
            </Group>
        </Modal>
    )
}