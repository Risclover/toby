import { useCreateAnnouncementMutation } from "@/store/announcementSlice"
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button, Checkbox, Group, Modal, Space, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import styles from "../styles/CreateAnnouncement.module.css";
import { useCreateAnnouncementModal } from "@/contexts";
import { RemainingChars } from "@/components/RemainingChars";
import { useModalFocus } from "@/hooks/useModalFocus";


export const CreateAnnouncement = () => {
    const { isOpen, closeModal } = useCreateAnnouncementModal();

    const { data: user } = useAuthenticateQuery();
    const [message, setMessage] = useState("");
    const [isImportant, setIsImportant] = useState(false);
    const [createAnnouncement] = useCreateAnnouncementMutation();
    const [error, setError] = useState("");
    const [remainingChars, setRemainingChars] = useState(255);
    const { ref: nameRef, transitionProps } = useModalFocus<HTMLTextAreaElement>();

    useEffect(() => {
        setRemainingChars(255 - message.trim().length);
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
        closeModal();
    }

    const handleCancelAnnouncement = () => {
        closeModal();
    }

    return (
        <Modal transitionProps={transitionProps} radius="md" className="announcement-modal" opened={isOpen} onClose={closeModal} title="Create announcement" centered>
            <Textarea
                ref={nameRef}
                classNames={{ input: styles.input }}
                autosize
                minRows={2}
                maxRows={5}
                maxLength={255}
                placeholder="Ex: Eat your peas"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <div className="create-announcement-subtext">
                <span className="create-announcement-error">{error}</span>
                <RemainingChars count={message.length} max={255} />
            </div>
            {error.length > 0 && <Space h="md" />}
            <Checkbox
                size="xs"
                color="rgb(5, 5, 73)"
                radius="xs"
                label="Mark as important"
                c="black"
                description="Important announcements are highlighted."
                checked={isImportant}
                onChange={(e) => setIsImportant(e.currentTarget.checked)}
                styles={{ label: { fontSize: "1rem" }, description: { color: "var(--sub-text)", fontSize: "0.8rem" } }}
            />
            <Space h="md" />
            <Group justify="flex-end">
                <Button
                    onClick={handleCancelAnnouncement}
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    color="var(--mantine-color-dark-6)"
                    variant="outline"
                    styles={{ label: { fontWeight: "400" } }}
                >
                    Cancel
                </Button>
                <Button
                    className="tasklist-settings-footer-btn"
                    size="compact-sm"
                    variant="light"
                    fw={400}
                    color="rgb(5, 5, 73)"
                    onClick={handleCreateAnnouncement}
                >
                    Save
                </Button>
            </Group>
        </Modal>
    )
}