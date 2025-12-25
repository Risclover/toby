import { useCreateAnnouncementMutation } from "@/store/announcementSlice"
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button, Checkbox, Group, Modal, Space, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import styles from "../styles/CreateAnnouncement.module.css";

type Props = {
    opened: boolean;
    close: () => void;
}

export const CreateAnnouncement = ({ opened, close }: Props) => {
    const { data: user } = useAuthenticateQuery();
    const [message, setMessage] = useState("");
    const [isImportant, setIsImportant] = useState(false);
    const [createAnnouncement] = useCreateAnnouncementMutation();
    const [error, setError] = useState("");
    const [remainingChars, setRemainingChars] = useState(500);

    useEffect(() => {
        setRemainingChars(500 - message.trim().length);
    }, [message])

    const handleCreateAnnouncement = async () => {
        if (message.trim().length === 0) {
            setError("Announcement message cannot be empty.");
            setMessage("");
            return;
        } else {
            await createAnnouncement({
                message: message.trim(),
                householdId: user.householdId,
                isImportant
            });
        }
        setMessage("");
        setIsImportant(false);
        close();
    }

    const handleCancelAnnouncement = () => {
        close();
    }

    return (
        <Modal radius="lg" className="announcement-modal" opened={opened} onClose={close} title="Add announcement" centered>
            <Textarea
                classNames={{ input: styles.input }}
                styles={{ input: { background: "transparent", color: "white" } }}
                radius="md"
                autosize
                minRows={2}
                maxRows={5}
                maxLength={500}
                placeholder="Ex: Eat your peas"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <div className="create-announcement-subtext">
                <span className="create-announcement-error">{error}</span>
                <div className="create-announcement-chars">
                    <span className={`create-announcement-remaining${remainingChars === 0 ? " remaining-none" : ""}`}>{remainingChars}</span>
                    /500
                </div>
            </div>
            {error.length > 0 && <Space h="md" />}
            <Checkbox
                size="xs"
                color="cyan"
                radius="xs"
                label="Mark as important"
                description="Important announcements are highlighted."
                checked={isImportant}
                onChange={(e) => setIsImportant(e.currentTarget.checked)}
                styles={{ label: { fontSize: "1rem" }, description: { color: "var(--sub-text)", fontSize: "0.8rem" } }}
            />
            <Space h="md" />
            <Group justify="flex-end">
                <Button
                    onClick={handleCancelAnnouncement}
                    color="cyan.5"
                    size="compact-sm"
                    variant="subtle"
                    radius="xl"
                    styles={{ label: { fontWeight: "400" } }}
                >
                    Cancel
                </Button>
                <Button
                    color="cyan"
                    size="compact-sm"
                    onClick={handleCreateAnnouncement}
                    radius="xl"
                    styles={{ label: { fontWeight: "400" } }}
                >
                    Save
                </Button>
            </Group>
        </Modal>
    )
}