import { useCreateAnnouncementMutation } from "@/store/announcementSlice"
import { useAuthenticateQuery } from "@/store/authSlice";
import { Button, Modal } from "@mantine/core";
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

    return <Modal opened={opened} onClose={close} title="Create Todo List" centered>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex: Eat your peas" />
        <Button color="violet" onClick={handleCreateAnnouncement}>Submit</Button>
    </Modal>
}