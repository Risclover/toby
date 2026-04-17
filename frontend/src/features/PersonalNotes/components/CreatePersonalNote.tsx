import { useEffect, useState, type MouseEvent } from "react";
import { useCreateNoteMutation } from "@/store/noteSlice";
import { Button, Textarea, Text, Switch, Group, Badge, Chip, Modal, UnstyledButton, Tooltip } from "@mantine/core";
import { useForm } from "@mantine/form";
import { SimpleEditor } from "@/components/TipTap/tiptap-templates/simple/simple-editor";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useNavigate, useParams } from "react-router-dom";
import { FormColorInput } from "@/components/FormColorInput";
import { CreateNoteCategory } from "@/features/PersonalNoteCategories/components/CreateNoteCategory";
import { FaGlobeAmericas } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import { FaFolderClosed } from "react-icons/fa6";
import { FaLock } from "react-icons/fa6";
import { useIsMobile, useIsSmallScreen } from "@/hooks";
import { PersonalNoteCategories } from "@/features/PersonalNoteCategories/components/PersonalNoteCategories";
import { VscClose } from "react-icons/vsc";




interface NoteFormValues {
    title: string;
    body: string;
    isPrivate: boolean;
}

type Props = {
    showNoteForm: boolean;
    setShowNoteForm: (val: boolean) => void;
}

const MAX_BODY_LENGTH = 10000;

export const CreatePersonalNote = ({ showNoteForm, setShowNoteForm }: Props) => {
    const isSmallScreen = useIsSmallScreen(480);
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { userId } = useParams();
    const [createPersonalNote] = useCreateNoteMutation();
    const [charCount, setCharCount] = useState(0);
    const [editorKey, setEditorKey] = useState(0);
    const [isPrivate, setIsPrivate] = useState(false);
    const [showNoteCategoryModal, setShowNoteCategoryModal] = useState(false);
    const { ref: nameRef, transitionProps } = useModalFocus<HTMLTextAreaElement>();

    const form = useForm<NoteFormValues>({
        initialValues: { title: "", body: "", isPrivate: false },
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
        await createPersonalNote({
            title: values.title || undefined,
            body: values.body,
            isPrivate: isPrivate
        }).unwrap();

        form.reset();
        setCharCount(0);
        setEditorKey(k => k + 1); // Force SimpleEditor remount with empty content
        setShowNoteForm(false);
    });

    const handleCancel = () => {
        setShowNoteForm(false);
    }

    const handleChangeVisibility = (e: MouseEvent) => {
        e.preventDefault();
        setIsPrivate(prev => !prev);
        form.setFieldValue("isPrivate", isPrivate);
    }

    const handleClose = () => {
        setShowNoteForm(false);
        form.reset();
    }

    const handleOpenCategories = () => {
        setShowNoteCategoryModal(true);
    }

    useEffect(() => {
        console.log('form:', form);
    }, [form])

    return (
        <Modal styles={{
            body: { display: "flex", flexDirection: "column", padding: 0, height: "100%", overflow: 'hidden' },
            content: { overflow: 'hidden', display: "flex", flexDirection: "column" }
        }} fullScreen opened={showNoteForm} onClose={handleClose}>
            <form onSubmit={handleCreateNote} className="create-note-modal-form">
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
                                padding: 0,
                                lineHeight: 1.2
                            }
                        }}
                    />

                    <div className="personal-note-form-subheader">
                        <Tooltip.Group openDelay={300} closeDelay={100}>
                            <PersonalNoteCategories setShowNoteCategoryModal={setShowNoteCategoryModal} />
                            <Tooltip withArrow label="Choose category">
                                <button className="personal-note-form-category" onClick={handleOpenCategories}>
                                    <FaFolderClosed size=".825rem" color="var(--mantine-color-gray-7)" /> Uncategorized
                                </button>
                            </Tooltip>

                            <Tooltip withArrow label="Change note visibility">
                                <button onClick={handleChangeVisibility} className="personal-note-form-category">
                                    {isPrivate ?
                                        <><FaGlobeAmericas size=".825rem" color="var(--mantine-color-gray-7)" /> Public</> : <><FaLock size=".825rem" color="var(--mantine-color-gray-7)" /> Private</>}
                                </button>
                            </Tooltip>
                        </Tooltip.Group>
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
                    <Text ml={10} size="xs" c={charCount > MAX_BODY_LENGTH ? "red" : "dimmed"} mt={4}>
                        {charCount.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
                    </Text>
                    {form.errors.body && (
                        <Text size="xs" c="red" mt={4}>{form.errors.body}</Text>
                    )}
                </div>
                <div className="personal-note-form-footer">
                    <Button mb={isSmallScreen ? "40px" : ""} m={isSmallScreen ? "0 auto 40px auto" : "0 0 40px 0"} w={isSmallScreen ? "300px" : "100px"} disabled={!form.isDirty() || !form.isValid()} fw={500} size="sm" p={isSmallScreen ? ".75rem 1.25rem" : ".5rem 1.25rem"} h="auto" radius="xl" color="rgb(5, 5, 73)" type="submit">Post</Button>
                </div>
            </form>
            <CreateNoteCategory opened={showNoteCategoryModal} close={() => setShowNoteCategoryModal(false)} />
        </Modal>
    );
};