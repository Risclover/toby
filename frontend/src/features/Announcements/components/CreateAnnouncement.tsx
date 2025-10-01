import { useCreateAnnouncementMutation } from "@/store/announcementSlice"
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button, Group, Modal, Space, TextInput } from "@mantine/core";
import { useState } from "react";

type Props = {
    opened: boolean;
    close: () => void;
}

export const CreateAnnouncement = ({ opened, close }: Props) => {
    const { data: user } = useAuthenticateQuery();
    const [text, setText] = useState("");

    const [createAnnouncement] = useCreateAnnouncementMutation();

    const handleCreateAnnouncement = async () => {
        await createAnnouncement({ text, householdId: user.householdId, isPinned: false, expiresAt: null });
        close();
    }

    return <Modal className="announcement-modal" opened={opened} onClose={close} title="Create Announcement" centered>
        <TextInput type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex: Eat your peas" />
        <Space h="md" />
        <Group justify="flex-end"> <Button color="cyan" onClick={handleCreateAnnouncement}>Submit</Button></Group>
    </Modal>
}