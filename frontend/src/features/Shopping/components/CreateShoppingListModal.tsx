import { HouseholdMemberSelection } from "@/components/HouseholdMemberSelection";
import { useMemberSelection } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { useCreateShoppingListMutation } from "@/store";
import { Button, Modal, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";

type Props = {
    opened: boolean;
    onClose: () => void;
}
export const CreateShoppingListModal = ({ opened, onClose }: Props) => {
    const { data: household } = useHousehold();
    const form = useForm({
        initialValues: { title: "" },
        validate: {
            title: (v) => v.trim().length === 0 ? "Name your shopping list" : null
        }
    })

    const {
        allMembers,
        someSelected,
        memberIds,
        toggleAll,
        toggleOne,
        selected,
        reset: resetMembers
    } = useMemberSelection(household?.members);

    const [createShoppingList] = useCreateShoppingListMutation();
    const canSubmit = form.isValid() && (allMembers || memberIds.length > 0);

    const handleClose = () => {
        form.reset();
        resetMembers();
        onClose();
    }

    const handleSubmit = form.onSubmit(async ({ title }) => {
        await createShoppingList({
            title,
            householdId: household.id,
            allMembers,
            memberIds,
        }).unwrap();
        handleClose();
    });


    return (
        <Modal
            opened={opened}
            onClose={onClose}
            radius="md"
            centered
            title="Create shopping list"
        >
            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput
                        label="Title"
                        placeholder='e.g., "Weekly Groceries"'
                        maxLength={64}
                        required
                        {...form.getInputProps("title")}
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
                    <Button type="submit" disabled={!canSubmit} variant="filled" color="cyan">Submit</Button>
                </Stack>
            </form>
        </Modal>
    )
}