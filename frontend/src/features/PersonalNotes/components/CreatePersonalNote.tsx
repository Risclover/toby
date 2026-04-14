import { useState } from "react";
import { useCreateNoteMutation } from "@/store/noteSlice";
import { Button, Textarea, Text, Switch, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { SimpleEditor } from "@/components/TipTap/tiptap-templates/simple/simple-editor";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useNavigate, useParams } from "react-router-dom";
import { FormColorInput } from "@/components/FormColorInput";

interface NoteFormValues {
    title: string;
    body: string;
    isPrivate: boolean;
    color: string;
}

type Props = {
    setShowNoteForm: (val: boolean) => void;
    onNoteCreated: (val: string) => void;
}

const MAX_BODY_LENGTH = 10000;

export const CreatePersonalNote = ({ setShowNoteForm, onNoteCreated }: Props) => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [createPersonalNote] = useCreateNoteMutation();
    const [charCount, setCharCount] = useState(0);
    const [editorKey, setEditorKey] = useState(0);
    const { ref: nameRef, transitionProps } = useModalFocus<HTMLTextAreaElement>();

    const form = useForm<NoteFormValues>({
        initialValues: { title: "", body: "", isPrivate: false, color: "rgb(5, 5, 73)" },
        validate: {
            body: (value) => {
                const plain = value.replace(/<[^>]*>/g, "").trim();
                if (plain.length === 0) return "Please give your note some content.";
                if (plain.length > MAX_BODY_LENGTH) return `Content must be ${MAX_BODY_LENGTH.toLocaleString()} characters or fewer.`;
                return null;
            }
        }
    });


    const handleCreateNote = form.onSubmit(async (values) => {
        const data = await createPersonalNote({
            title: values.title || undefined,
            body: values.body,
            isPrivate: values.isPrivate,
            color: values.color
        }).unwrap();

        form.reset();
        setCharCount(0);
        setEditorKey(k => k + 1); // Force SimpleEditor remount with empty content
        setShowNoteForm(false);
        onNoteCreated(data.id);
    });

    const handleCancel = () => {
        setShowNoteForm(false);

    }

    return (
        <div className="create-personal-note-form">
            <form onSubmit={handleCreateNote}>
                <div className="personal-note-form-header">
                    <Textarea
                        placeholder="Add title"
                        maxLength={255}
                        minRows={1}
                        w="100%"
                        autosize
                        radius="sm"
                        ref={nameRef}
                        {...form.getInputProps("title")}
                        styles={{
                            input: {
                                border: "none",
                                background: "transparent",
                                fontSize: "var(--text-2xl)",
                                fontWeight: 600,
                                color: "black",
                                marginRight: "3rem",
                                padding: 0
                            }
                        }}
                    />
                    <div className="personal-note-form-header-right">
                        <Button onClick={handleCancel} fw={500} size="sm" p=".5rem 1rem" h="auto" radius="sm" color="rgb(5, 5, 73)" variant="outline">Cancel</Button>
                        <Button disabled={!form.isDirty() || !form.isValid()} fw={500} size="sm" p=".5rem 1.25rem" h="auto" radius="sm" color="rgb(5, 5, 73)" type="submit">Save</Button>
                    </div>
                </div>

                <div className="personal-note-form-content">
                    <SimpleEditor
                        key={editorKey}
                        onChange={(html) => {
                            form.setFieldValue("body", html);
                            setCharCount(html.replace(/<[^>]*>/g, "").length);
                        }}
                    />
                    <Text size="xs" c={charCount > MAX_BODY_LENGTH ? "red" : "dimmed"} mt={4}>
                        {charCount.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
                    </Text>
                    {form.errors.body && (
                        <Text size="xs" c="red" mt={4}>{form.errors.body}</Text>
                    )}
                </div>
                <FormColorInput form={form} label="Color" required />
                <Group>Make private?
                    <Switch
                        size="md"
                        withThumbIndicator={false}
                        {...form.getInputProps('isPrivate', { type: 'checkbox' })}
                    /></Group>
            </form>
        </div>
    );
};