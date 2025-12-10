import { useCreateAnnouncementMutation } from "@/store/announcementSlice"
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button, Checkbox, Group, Modal, Space, TextInput } from "@mantine/core";
import { useState } from "react";

type Props = {
    opened: boolean;
    close: () => void;
}

export const CreateAnnouncement = ({ opened, close }: Props) => {
    const { data: user } = useAuthenticateQuery();
    const [message, setMessage] = useState("");
    const [isImportant, setIsImportant] = useState(false);
    const [createAnnouncement] = useCreateAnnouncementMutation();

    const handleCreateAnnouncement = async () => {
        await createAnnouncement({ message, householdId: user.householdId, isImportant: isImportant });
        close();
    }

    return <Modal className="announcement-modal" opened={opened} onClose={close} title="Create Announcement" centered>
        <TextInput type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ex: Eat your peas" />
        <Checkbox label="Mark as important" checked={isImportant} onChange={(e) => setIsImportant(e.currentTarget.checked)} />
        <Space h="md" />
        <Group justify="flex-end"> <Button color="cyan" onClick={handleCreateAnnouncement}>Submit</Button></Group>
    </Modal>
}