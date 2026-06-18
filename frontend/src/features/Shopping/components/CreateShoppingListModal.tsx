import { FormColorInput } from "@/components";
import { HouseholdMemberSelection } from "@/components/HouseholdMemberSelection";
import { useMemberSelection } from "@/hooks";
import { useHousehold } from "@/hooks/useHousehold";
import { useCreateShoppingListMutation } from "@/store";
import { isTooLight } from "@/utils";
import { Button, Input, Modal, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";

type Props = {
    opened: boolean;
    onClose: () => void;
}
export const CreateShoppingListModal = ({ opened, onClose }: Props) => {
    const { data: household } = useHousehold();
    const form = useForm({
        initialValues: { title: "", color: "#15aabf" },
        validate: {
            title: (v) => v.trim().length === 0 ? "Name your shopping list" : null,
            color: (v) => isTooLight(v),
        }
    })
    const hasColorError = isTooLight(form.values.color);
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

    const handleSubmit = form.onSubmit(async ({ title, color }) => {
        await createShoppingList({
            title,
            householdId: household.id,
            allMembers,
            memberIds,
            color
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
                    <div>
                        <FormColorInput form={form} label="Color" required={true} />
                        {hasColorError && <Input.Error>This color is too light. Please choose something darker.</Input.Error>}
                    </div>
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