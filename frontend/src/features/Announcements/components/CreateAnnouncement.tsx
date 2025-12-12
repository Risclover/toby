import { useCreateAnnouncementMutation } from "@/store/announcementSlice"
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button, Checkbox, Group, Modal, Space, Switch, Textarea, TextInput } from "@mantine/core";
import { classNames } from "primereact/utils";
import { useState } from "react";
import { input } from "../styles/CreateAnnouncement.module.css";

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

    const handleCancelAnnouncement = () => {
        close();
    }

    return <Modal radius="lg" className="announcement-modal" opened={opened} onClose={close} title="Add announcement" centered>
        <Textarea classNames={{ input }} styles={{ input: { background: "transparent", color: "white" } }} radius="md" autosize minRows={2} maxRows={5} maxLength={500} placeholder="Ex: Eat your peas" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Space h="md" />
        <Checkbox size="xs" color="cyan" radius="xs" label="Mark as important" description="Important announcements are highlighted." checked={isImportant} onChange={(e) => setIsImportant(e.currentTarget.checked)} styles={{ label: { fontSize: "1rem" }, description: { color: "var(--sub-text)", fontSize: "0.8rem" } }} />
        <Space h="md" />
        <Group justify="flex-end">
            <Button onClick={handleCancelAnnouncement} color="cyan.5" size="compact-sm" variant="subtle" radius="xl" styles={{ label: { fontWeight: "400" } }}> Cancel</Button>
            <Button color="cyan" size="compact-sm" onClick={handleCreateAnnouncement} radius="xl" styles={{ label: { fontWeight: "400" } }}>Save</Button></Group>
    </Modal >
}