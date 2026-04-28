import { useState, type MouseEvent } from "react";
import { Button, Text, Modal, Tooltip, Textarea } from "@mantine/core";
import { SimpleEditor } from "@/components/TipTap/tiptap-templates/simple/simple-editor";
import { useModalFocus } from "@/hooks/useModalFocus";
import { CreateNoteCategory } from "@/features/PersonalNoteCategories/components/CreateNoteCategory";
import { FaGlobeAmericas } from "react-icons/fa";
import { FaLock } from "react-icons/fa6";
import { useIsSmallScreen } from "@/hooks";
import { PersonalNoteCategories } from "@/features/PersonalNoteCategories/components/PersonalNoteCategories";
import { PersonalNoteCategoriesDrawer } from "@/features/PersonalNoteCategories/components/PersonalNoteCategoriesDrawer";
import { useCreateNoteForm } from "../hooks/useCreateNoteForm";
import { useGetUserSettingsQuery } from "@/store/userSettingsSlice";
import { useAuthenticateQuery } from "@/store";

type Props = {
    showNoteForm: boolean;
    setShowNoteForm: (val: boolean) => void;
};

export const CreatePersonalNote = ({ showNoteForm, setShowNoteForm }: Props) => {
    const isSmallScreen = useIsSmallScreen(480);
    const [showNoteCategoryModal, setShowNoteCategoryModal] = useState(false);
    const [showNoteCategoryDrawer, setShowNoteCategoryDrawer] = useState(false);
    const { ref: nameRef } = useModalFocus<HTMLTextAreaElement>();

    const {
        form,
        charCount,
        editorKey,
        selectedCategory,
        handleSelectCategory,
        handleBodyChange,
        handleToggleVisibility,
        handleSubmit,
        handleReset,
        MAX_BODY_LENGTH,
    } = useCreateNoteForm(() => setShowNoteForm(false));

    const handleClose = () => {
        setShowNoteForm(false);
        handleReset();
    };

    return (
        <Modal
            styles={{
                body: { display: "flex", flexDirection: "column", padding: 0, height: "100%", overflow: "hidden" },
                content: { overflow: "hidden", display: "flex", flexDirection: "column" },
            }}
            fullScreen
            opened={showNoteForm}
            onClose={handleClose}
        >
            <form onSubmit={handleSubmit} className="create-note-modal-form">
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
                                lineHeight: 1.2,
                            },
                        }}
                    />
                    <div className="personal-note-form-subheader">
                        <Tooltip.Group openDelay={300} closeDelay={100}>
                            {isSmallScreen ? (
                                <>
                                    <PersonalNoteCategories
                                        form={form}
                                        setShowNoteCategoryModal={setShowNoteCategoryModal}
                                        selectedCategory={selectedCategory}
                                        onSelectCategory={handleSelectCategory}
                                        isSmallScreen
                                        onOpenDrawer={() => setShowNoteCategoryDrawer(true)}
                                    />
                                    <PersonalNoteCategoriesDrawer
                                        form={form}
                                        showNoteCategoryDrawer={showNoteCategoryDrawer}
                                        setShowNoteCategoryDrawer={setShowNoteCategoryDrawer}
                                        setShowNoteCategoryModal={setShowNoteCategoryModal}
                                        selectedCategory={selectedCategory}
                                        onSelectCategory={handleSelectCategory}
                                    />
                                </>
                            ) : (
                                <PersonalNoteCategories
                                    form={form}
                                    setShowNoteCategoryModal={setShowNoteCategoryModal}
                                    selectedCategory={selectedCategory}
                                    onSelectCategory={handleSelectCategory}
                                />
                            )}
                            <Tooltip withArrow label="Change note visibility">
                                <button
                                    onClick={(e) => { e.preventDefault(); handleToggleVisibility(); }}
                                    className="personal-note-form-category"
                                >
                                    {form.values.isPrivate
                                        ? <><FaLock size=".825rem" color="var(--mantine-color-gray-7)" /> Private</>
                                        : <><FaGlobeAmericas size="14px" color="var(--mantine-color-gray-7)" /> Public</>
                                    }
                                </button>
                            </Tooltip>
                        </Tooltip.Group>
                    </div>
                </div>

                <div className="personal-note-form-content">
                    <SimpleEditor key={editorKey} onChange={handleBodyChange} />
                    <Text ml={10} size="xs" c={charCount > MAX_BODY_LENGTH ? "red" : "dimmed"} mt={4}>
                        {charCount.toLocaleString()} / {MAX_BODY_LENGTH.toLocaleString()}
                    </Text>
                    {form.errors.body && (
                        <Text size="xs" c="red" mt={4}>{form.errors.body}</Text>
                    )}
                </div>

                <div className="personal-note-form-footer">
                    <Button
                        mb={isSmallScreen ? "40px" : ""}
                        m={isSmallScreen ? "0 auto 40px auto" : "0 0 40px 0"}
                        w={isSmallScreen ? "300px" : "100px"}
                        disabled={!form.isDirty() || !form.isValid()}
                        fw={500}
                        size="sm"
                        p={isSmallScreen ? ".75rem 1.25rem" : ".5rem 1.25rem"}
                        h="auto"
                        radius="xl"
                        color="rgb(5, 5, 73)"
                        type="submit"
                    >
                        Post
                    </Button>
                </div>
            </form>
            <CreateNoteCategory
                opened={showNoteCategoryModal}
                close={() => setShowNoteCategoryModal(false)}
                onCategoryCreated={handleSelectCategory}
            />
        </Modal>
    );
};