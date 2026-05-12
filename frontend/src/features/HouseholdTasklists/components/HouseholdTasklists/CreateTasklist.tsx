// CreateTasklist.tsx
import { Modal, Stack, TextInput, Button, ColorInput, Input } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCreateHouseholdTasklistMutation } from "@/store/taskSlice";
import { useCreateTasklistModal } from "@/contexts";
import { useHousehold } from "@/hooks/useHousehold";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useMemberSelection } from "@/hooks/useMemberSelection";
import { HouseholdMemberSelection } from "@/components/HouseholdMemberSelection";
import { useNavigate } from "react-router-dom";
import { FormColorInput } from "@/components/FormColorInput";
import { isTooLight } from "@/utils";
import { useCloseModalOnNavigate } from "@/hooks/useCloseModalOnNavigate";

type Props = { householdId: number };

export const CreateTasklist = ({ householdId }: Props) => {
    const navigate = useNavigate();
    const { isOpen, closeModal } = useCreateTasklistModal();
    const { ref: nameRef, transitionProps } = useModalFocus();
    const { data: household } = useHousehold();
    useCloseModalOnNavigate(closeModal)
    const form = useForm({
        initialValues: { title: "", color: "#15aabf" },
        validate: {
            title: (v) => v.trim().length === 0 ? "Title is required" : null,
            color: (v) => isTooLight(v),
        },
    });

    const hasColorError = isTooLight(form.values.color);

    const {
        allMembers,
        someSelected,
        memberIds,
        toggleAll,
        toggleOne,
        selected,
        reset: resetMembers,
    } = useMemberSelection(household?.members);

    const [createTasklist] = useCreateHouseholdTasklistMutation();

    const canSubmit = form.isValid() && (allMembers || memberIds.length > 0);

    const handleClose = () => {
        form.reset();
        resetMembers();
        closeModal();
    };

    const handleSubmit = form.onSubmit(async ({ title, color }) => {
        const newList = await createTasklist(
            allMembers
                ? { title, color, householdId, allMembers: true }
                : { title, color, householdId, allMembers: false, memberIds }
        ).unwrap();

        handleClose();
        navigate(`/tasklists/${newList.id}`);
    });

    return (
        <Modal
            transitionProps={transitionProps}
            radius="md"
            opened={isOpen}
            onClose={handleClose}
            title="Create tasklist"
            centered
        >
            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput
                        ref={nameRef}
                        label="Title"
                        placeholder='e.g., "Weekend Grocery Run"'
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
                    <Button type="submit" disabled={!canSubmit} variant="filled" color="cyan">
                        Submit
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
};