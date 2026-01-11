import { Button, Modal, Stack, TextInput } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useCreateHouseholdTodoListMutation } from "@/store/todoSlice";
import { useState, type FormEvent } from "react";
import { CreateTodoListMembers } from "./CreateTodoListMembers";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useMemberSelection } from "@/hooks/useMemberSelection";
import AddIcon from '@mui/icons-material/Add';

type CreateTodoList = {
    householdId: number
    open: () => void;
    close: () => void;
    opened: boolean;
}

export const CreateTodoList = ({ householdId, opened, open, close }: Props) => {
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

    const [createTodoList] = useCreateHouseholdTodoListMutation();

    const canSubmit =
        title.trim().length > 0 && (allMembers || memberIds.length > 0);

    const handleListCreation = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        if (allMembers) {
            await createTodoList({ title, householdId, allMembers: true } as const);
        } else {
            await createTodoList({
                title,
                householdId,
                allMembers: false,
                memberIds,
            } as const);
        }

        setTitle("");
        toggleAll(true);
        close();
    };

    return (
        <div className="create-list">
            <Modal opened={opened} onClose={close} title="Create Tasklist" centered>
                <Stack component="form" onSubmit={handleListCreation}>
                    <TextInput
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        label="Title"
                        placeholder='e.g., "Weekend Grocery Run"'
                        required
                    />
                    <CreateTodoListMembers
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
