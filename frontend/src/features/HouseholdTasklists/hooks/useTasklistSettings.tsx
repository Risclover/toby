import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIsSmallScreen } from "../../../hooks/useIsSmallScreen";
import { useArchiveListMutation, useAuthenticateQuery, useDeleteListMutation, useDuplicateListMutation, useGetHouseholdQuery, useGetTasklistQuery, useUnarchiveListMutation, useUpdateTasklistMutation, type User } from "@/store";
import { useSettingsModal } from "../../../hooks/useSettingsModal";
import { isNotEmpty } from "@mantine/form";
import { Avatar, Button, Group, Space, Stack, Text, type MultiSelectProps } from "@mantine/core";
import { useOutsideClick } from "../../../hooks/useOutsideClick";
import { notifications } from "@mantine/notifications";

export type TasklistFormValues = {
    title: string;
    showCompleted: boolean;
    newItemPosition: string;
    defaultSortOrder: string | null;
    color: string;
    viewMode: string;
    memberIds: string[];
    allMembers: boolean;
    defaultFilters: {
        importance: "all" | "important";
        assignedToId: number | null;
        time: "past_due" | "today" | "tomorrow" | "this_week" | "this_month" | "all";
    }
}

const TASKLIST_DEFAULT_VALUES: TasklistFormValues = {
    title: "",
    showCompleted: false,
    newItemPosition: "bottom",
    defaultSortOrder: "manual",
    color: "#15aabf",
    viewMode: "detailed",
    memberIds: [],
    allMembers: false,
    defaultFilters: {
        importance: "all",
        assignedToId: null,
        time: "all"
    }
}

type Props = {
    setShowTasklistSettings?: (val: boolean) => void;
    tasklistId: number | undefined;
}

export const useTasklistSettings = ({ setShowTasklistSettings = () => { }, tasklistId }: Props) => {
    const navigate = useNavigate();
    const tasklistTitleRef = useRef<HTMLInputElement>(null);
    const isSmallScreen = useIsSmallScreen();

    const [updateTasklist] = useUpdateTasklistMutation();
    const [archiveList] = useArchiveListMutation();
    const [unarchiveList] = useUnarchiveListMutation();
    const [duplicateList] = useDuplicateListMutation();
    const [deleteList] = useDeleteListMutation();

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data: tasklist } = useGetTasklistQuery(Number(tasklistId));

    const initialValues: TasklistFormValues = {
        title: tasklist?.title ?? "",
        showCompleted: tasklist?.showCompleted ?? false,
        newItemPosition: tasklist?.newItemPosition ?? "bottom",
        defaultSortOrder: tasklist?.defaultSortOrder || null,
        color: tasklist?.color ?? "#15aabf",
        viewMode: tasklist?.viewMode ?? "detailed",
        memberIds: (tasklist?.memberIds ?? []).map(String),
        allMembers: tasklist?.allMembers ?? false,
        defaultFilters: {
            importance: tasklist?.defaultFilters?.importance ?? "all",
            assignedToId: tasklist?.defaultFilters?.assignedToId ?? null,
            time: tasklist?.defaultFilters?.time ?? "all"
        }
    }

    const {
        form,
        isSubmitting,
        showDiscardWarning,
        setShowDiscardWarning,
        showDeleteConfirmation,
        setShowDeleteConfirmation,
        handleClose,
        handleDiscardConfirmation,
        handleSubmit,
        handleResetToDefaults
    } = useSettingsModal<TasklistFormValues>({
        entityId: tasklist?.id,
        initialValues,
        defaultValues: { ...TASKLIST_DEFAULT_VALUES, title: tasklist?.title ?? "" },
        validate: {
            memberIds: isNotEmpty("You must assign at least one member"),
        },
        onSubmit: async (values) => {
            await updateTasklist({
                listId: Number(tasklist?.id),
                data: {
                    ...values,
                    memberIds: values.memberIds.map(Number),
                }
            }).unwrap();
        },
        onClose: () => setShowTasklistSettings(false)
    });


    // ── Derived member data ──────────────────────────────────────────────────
    const allHouseholdMemberIds = useMemo(() => household?.members.map((m: User) => String(m.id)) ?? [], [household]);

    const memberOptions = useMemo(() => household?.members.map((member: User) => ({
        value: String(member.id),
        label: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        profileImg: member.profileImg
    })) ?? [], [household]);

    const usersData = useMemo(() => {
        if (isSmallScreen) return null;
        return Object.fromEntries(
            household?.members.map((member: User) => [String(member.id), { profileImg: member.profileImg }]) ?? [],
        )
    }, [household, isSmallScreen]);

    // Members valid for the default-filter assignee picker (scoped to list membership)
    const allowedMembers = useMemo(() => {
        if (!household?.members) return [];
        const members: User[] = tasklist?.allMembers ? household.members : household.members.filter((m: User) => (tasklist?.memberIds ?? []).map(Number).includes(m.id));
        return members.map((member) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
            id: member.id,
            firstName: member.firstName,
            profileImg: member.profileImg
        }))
    }, [household, tasklist]);


    // ── Side effect: reset filter assignee when they're removed from the list ──
    useEffect(() => {
        const { assignedToId } = form.values.defaultFilters;
        if (assignedToId === null) return;
        if (form.values.allMembers) return;
        if (form.values.memberIds.includes(String(assignedToId))) return;

        form.setFieldValue("defaultFilters.assignedToId", null);
    }, [form.values.allMembers, form.values.memberIds]);


    // ── Member handlers ──────────────────────────────────────────────────────
    const handleToggleAllMembers = (checked: boolean) => {
        form.setFieldValue("allMembers", checked);
        form.setFieldValue("memberIds", checked ? allHouseholdMemberIds : []);
    }

    const handleMemberChange = (values: string[]) => {
        form.setFieldValue("memberIds", values);
        form.setFieldValue("allMembers", values.length === allHouseholdMemberIds.length);
    }

    const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({ option }) =>
        !isSmallScreen && usersData ? (
            <Group gap="sm">
                <Avatar src={usersData[option.value]?.profileImg} size="sm" radius="xl" />
                <Text size="sm">{option.label}</Text>
            </Group>
        ) : (
            <Text size="sm">{option.label}</Text>
        );


    // ── Title input: revert to server value if left empty ───────────────────
    useOutsideClick(tasklistTitleRef, () => {
        if (!form.values.title.trim()) {
            form.setFieldValue("title", initialValues.title);
        }
    })

    const handleTitleBlur = () => {
        if (!form.values.title.trim()) {
            form.setFieldValue("title", initialValues.title);
        }
    };


    // ── Archive ──────────────────────────────────────────────────────────────
    const handleArchiveList = async () => {
        try {
            await archiveList({ listId: Number(tasklistId) }).unwrap();
            setShowTasklistSettings(false);
            navigate("/tasklists");
            notifications.show({
                color: "cyan",
                position: "bottom-center",
                autoClose: 5000,
                message: (
                    <>
                        Tasklist archived successfully.
                        <Space h="xs" />
                        <Group align="center" gap="0.5rem">
                            <Button
                                color="cyan"
                                variant="filled"
                                size="compact-xs"
                                styles={{
                                    label: {
                                        fontWeight: 400
                                    }
                                }}
                                onClick={() => navigate("/tasklists/archived")}
                            >
                                View archive
                            </Button>
                            <Button
                                color="cyan"
                                variant="filled"
                                size="compact-xs"
                                className="notify-focus-target"
                                styles={{
                                    label: {
                                        fontWeight: 400
                                    }
                                }}
                                onClick={handleUndoArchive}
                            >
                                Undo
                            </Button>
                        </Group>
                    </>
                ),
                onOpen: () => {
                    setTimeout(() => {
                        (document.querySelector('.notify-focus-target') as HTMLElement)?.focus();
                    }, 150);
                }
            })
        } catch {
            notifications.show({ message: "Error: Failed to archive list", color: "red'" })
        }
    }

    const handleUndoArchive = async () => {
        await unarchiveList({ listId: Number(tasklistId) }).unwrap();

        notifications.show({
            color: "cyan",
            position: "bottom-center",
            autoClose: 5000,
            message: (
                <Stack align="flex-start" gap="xs">
                    List unarchived successfully.
                    <Button
                        className="notify-focus-target"
                        color="cyan" variant="filled" size="compact-xs"
                        styles={{ label: { fontWeight: 400 } }}
                        onClick={() => navigate(`/tasklists/${tasklist?.id}`)}
                    >
                        View tasklist
                    </Button>
                </Stack>
            ),
            onOpen: () => {
                setTimeout(() => {
                    (document.querySelector(".notify-focus-target") as HTMLElement)?.focus();
                }, 150);
            },
        });
    }

    // ── Duplicate ────────────────────────────────────────────────────────────
    const handleDuplicateList = async () => {
        try {
            const newList = await duplicateList({ listId: Number(tasklistId) }).unwrap();
            notifications.show({
                color: "cyan",
                position: "bottom-center",
                autoClose: 5000,
                message: (
                    <Stack align="flex-start" gap="xs">
                        List duplicated successfully.
                        <Button
                            className="notify-focus-target"
                            color="cyan" variant="filled" size="compact-xs"
                            styles={{ label: { fontWeight: 400 } }}
                            onClick={() => {
                                setShowTasklistSettings(false);
                                navigate(`/tasklists/${newList.id}`);
                            }}
                        >
                            View list
                        </Button>
                    </Stack>
                ),
                onOpen: () => {
                    setTimeout(() => {
                        (document.querySelector(".notify-focus-target") as HTMLElement)?.focus();
                    }, 150);
                },
            });
        } catch {
            notifications.show({ message: "Error: Failed to duplicate list.", color: "red" });
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteList = async () => {
        await deleteList({ listId: tasklistId });
        setShowDeleteConfirmation(false);
        setShowTasklistSettings(false);
        navigate("/tasklists");
        notifications.show({
            message: "Tasklist deleted successfully.",
            color: "cyan",
            position: "bottom-center",
            autoClose: 5000,
        });
    };

    // ── Public API ───────────────────────────────────────────────────────────
    return {
        // From useSettingsModal
        form,
        isSubmitting,
        showDiscardWarning,
        setShowDiscardWarning,
        showDeleteConfirmation,
        setShowDeleteConfirmation,
        handleClose,
        handleDiscardConfirmation,
        handleSubmit,
        handleResetToDefaults,

        // Tasklist-specific
        tasklist,
        household,
        tasklistTitleRef,
        memberOptions,
        allowedMembers,
        renderMultiSelectOption,
        handleToggleAllMembers,
        handleMemberChange,
        handleTitleBlur,
        handleArchiveList,
        handleUndoArchive,
        handleDuplicateList,
        handleDeleteList,
    };
};