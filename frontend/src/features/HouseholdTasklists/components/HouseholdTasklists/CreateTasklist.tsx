import { Button, Modal, Stack, TextInput } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useCreateHouseholdTasklistMutation } from "@/store/taskSlice";
import { useState, type FormEvent } from "react";
import { CreateTasklistMembers } from "./CreateTasklistMembers"
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useMemberSelection } from "@/hooks/useMemberSelection";
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from "react-router-dom";

type CreateTasklist = {
    householdId: number
    open: () => void;
    close: () => void;
    opened: boolean;
}

export const CreateTasklist = ({ householdId, opened, open, close }: CreateTasklist) => {
    const navigate = useNavigate();
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const [title, setTitle] = useState("");

    // OWN the selection state here
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

        let newList;
        if (allMembers) {
            newList = await createTasklist({ title, householdId, allMembers: true }).unwrap();
        } else {
            newList = await createTasklist({
                title,
                householdId,
                allMembers: false,
                memberIds,
            }).unwrap();
        }

        // 1. Success! Access the ID
        const newId = newList.id;

        // 2. Cleanup
        setTitle("");
        toggleAll(true);
        close();

        // 3. Navigate
        navigate(`/tasklists/${newId}`); // Adjust path as needed
    };

    return (
        <div className="create-list">
            <Modal radius="md" opened={opened} onClose={close} title="Create Tasklist" centered>
                <Stack component="form" onSubmit={handleListCreation}>
                    <TextInput
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        label="Title"
                        placeholder='e.g., "Weekend Grocery Run"'
                        required
                        maxLength={64}
                    />
                    <CreateTasklistMembers
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
        </div>
    );
};
