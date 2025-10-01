import { ActionIcon, CopyButton, Modal, Space, Text, TextInput, Tooltip } from "@mantine/core";
import { useState } from "react";
import { useAuthenticateQuery, useGenerateInviteMutation } from "@/store/authSlice";
import { IoCopyOutline } from "react-icons/io5";
import { HiCheck } from "react-icons/hi";



type Props = {
    opened: boolean;
    close: () => void;
}
export const InviteLink = ({ opened, close }: Props) => {
    const [inviteCode, setInviteCode] = useState("");



    const { data: user } = useAuthenticateQuery();
    const [generateInvite] = useGenerateInviteMutation();

    const handleInvite = async () => {
        const { data } = await generateInvite({ householdId: user.householdId });
        if (data) {
            setInviteCode(data.invite_code)
        }
    }

    return (
        <Modal opened={opened} onClose={close} title="Invite people to your household" centered>
            <Text size="sm">Joining your household is as easy as following an invite link!</Text>
            <Space h="lg" />
            <TextInput value={inviteCode !== "" ? `localhost:5173/join/${inviteCode}` : ""} rightSection={<CopyButton value={inviteCode !== "" ? `localhost:5173/join/${inviteCode}` : ""} timeout={2000}>
                {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                        <ActionIcon size="sm" disabled={inviteCode === ""} color={copied ? 'cyan' : 'cyan'} variant="subtle" onClick={copy}>
                            {copied ? <HiCheck /> : <IoCopyOutline />}
                        </ActionIcon>
                    </Tooltip>
                )}
            </CopyButton>

            } readOnly />
            <button className="generate-new-link-btn" onClick={handleInvite}>
                Generate new link</button>
            <Space h="sm" />
        </Modal >
    )
}