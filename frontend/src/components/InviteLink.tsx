import { ActionIcon, CopyButton, Modal, Space, Text, TextInput, Tooltip } from "@mantine/core";
import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAuthenticateQuery, useGenerateInviteMutation } from "@/store/authSlice";
import { IoCopyOutline } from "react-icons/io5";
import { HiCheck } from "react-icons/hi";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useHousehold } from "@/hooks/useHousehold";

type Props = {
    opened: boolean;
    close: () => void;
};

export const InviteLink = ({ opened, close }: Props) => {
    const { data: user } = useAuthenticateQuery();
    // If householdId is unknown, skip the query for now
    const householdId = user?.householdId;
    const { data: household } = useHousehold();

    const [inviteCode, setInviteCode] = useState<string>(""); // always a string

    const [generateInvite, { isLoading: generating }] = useGenerateInviteMutation();

    // When household loads/changes, sync the code into local state
    useEffect(() => {
        setInviteCode(household?.inviteCode ?? "");
    }, [household]);

    const handleInvite = async () => {
        if (!householdId) return; // guard
        try {
            const res = await generateInvite({ householdId }).unwrap();
            setInviteCode(res.invite_code ?? ""); // normalize to string
        } catch (e) {
            // optionally show a toast
            console.error(e);
        }
    };

    const inviteUrl = inviteCode ? `http://localhost:5173/join/${inviteCode}` : "";

    return (
        <Modal
            opened={opened}
            onClose={close}
            title="Invite people to your household"
            centered
            className="invite-member-modal"
        >
            <Text size="sm">Invite someone to your household by sending them an invite link!</Text>
            <Space h="sm" />

            <TextInput
                value={inviteUrl}
                readOnly
                aria-label="Household invite link"
                rightSection={
                    <CopyButton value={inviteUrl} timeout={2000} aria-label="Copy invite link">
                        {({ copied, copy }) => (
                            <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right" events={{ hover: true, focus: true, touch: true }}>
                                <ActionIcon
                                    size="sm"
                                    disabled={!inviteCode}
                                    color={copied ? "cyan" : "cyan"}
                                    variant="subtle"
                                    onClick={copy}
                                    aria-label="Copy invite link"
                                >
                                    {copied ? <HiCheck /> : <IoCopyOutline />}
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </CopyButton>
                }
            />

            <button className="generate-new-link-btn" onClick={handleInvite} disabled={!householdId || generating}>
                {generating ? "Generating…" : "Generate new link"}
            </button>
            <Text size="xs" c="var(--sub-text)"><em><strong>Note</strong>: Generating a new invite link will immediately deactivate the current link, making it unusable.</em></Text>
        </Modal>
    );
};
