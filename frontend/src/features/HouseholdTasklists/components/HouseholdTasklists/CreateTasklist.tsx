// CreateTasklist.tsx
import { Modal, Stack, TextInput, Button } from "@mantine/core";
import { useCreateHouseholdTasklistMutation } from "@/store/taskSlice";
import { useState, type FormEvent } from "react";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useMemberSelection } from "@/hooks/useMemberSelection";
import { HouseholdMemberSelection } from "@/components/HouseholdMemberSelection";
import { useNavigate } from "react-router-dom";
import { useCreateTasklistModal } from "@/contexts";
import { useHousehold } from "@/hooks/useHousehold";
import { useModalFocus } from "@/hooks/useModalFocus";

type Props = { householdId: number };

export const CreateTasklist = ({ householdId }: Props) => {
    const navigate = useNavigate();
    const { isOpen, closeModal } = useCreateTasklistModal();
    const { ref: nameRef, transitionProps } = useModalFocus();
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useHousehold();
    const [title, setTitle] = useState("");

    const {
        allMembers,
        someSelected,
        memberIds,
        toggleAll,
        toggleOne,
        selected,
    } = useMemberSelection(household?.members);

    const [createTasklist] = useCreateHouseholdTasklistMutation();

    const canSubmit =
        title.trim().length > 0 && (allMembers || memberIds.length > 0);

    const handleListCreation = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const newList = await createTasklist(
            allMembers
                ? { title, householdId, allMembers: true, }
                : { title, householdId, allMembers: false, memberIds }
        ).unwrap();

        const newId = newList.id;

        setTitle("");
        toggleAll(true);
        closeModal();
        navigate(`/tasklists/${newId}`);
    };

    return (
        <Modal
            transitionProps={transitionProps}
            radius="md"
            opened={isOpen}          // <- key line
            onClose={closeModal}  // <- key line
            title="Create Tasklist"
            centered
        >
            <Stack component="form" onSubmit={handleListCreation}>
                <TextInput
                    ref={nameRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    label="Title"
                    placeholder='e.g., "Weekend Grocery Run"'
                    required
                    maxLength={64}
                />
                <HouseholdMemberSelection
                    title="Who is this list for?"
                    members={household?.members}
                    allMembers={allMembers}
                    someSelected={someSelected}
                    selected={selected}
                    onToggleAll={toggleAll}
                    onToggleOne={toggleOne}
                />
                <Button type="submit" disabled={!canSubmit} variant="filled" color="cyan">
                    Submit
                </Button>
            </Stack>
        </Modal>
    );
};
