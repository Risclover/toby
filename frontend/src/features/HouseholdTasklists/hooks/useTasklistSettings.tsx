import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, isNotEmpty } from "@mantine/form";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useAuthenticateQuery, type User } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useArchiveListMutation, useDeleteListMutation, useDuplicateListMutation, useGetTasklistQuery, useUnarchiveListMutation, useUpdateTasklistMutation } from "@/store/taskSlice";
import { type MultiSelectProps, Avatar, Button, Flex, Group, Space, Stack, Text } from "@mantine/core";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { notifications } from '@mantine/notifications'; // <--- Import logic

// Define the exact shape of your form values
export type TasklistFormValues = {
    title: string;
    showCompleted: boolean;
    newItemPosition: string;
    defaultSortOrder: string | null;
    color: string;
    viewMode: string;
    memberIds: string[]; // MultiSelect uses strings
    allMembers: boolean;
    defaultFilters: {
        importance: "all" | "important";
        assignedToId: number | null;
        time: "past_due" | "today" | "tomorrow" | "this_week" | "this_month" | "all";
    };
};

type Props = {
    setShowTasklistSettings?: (val: boolean) => void;
    tasklistId: number | undefined;
};

export const useTasklistSettings = ({ setShowTasklistSettings = () => { }, tasklistId }: Props) => {
    const navigate = useNavigate();
    const tasklistTitleRef = useRef<HTMLInputElement>(null);
    const isSmallScreen = useIsSmallScreen();
    const [updateTasklist] = useUpdateTasklistMutation();
    const [archiveList] = useArchiveListMutation();
    const [unarchiveList] = useUnarchiveListMutation();
    const [duplicateList] = useDuplicateListMutation();
    const [deleteList] = useDeleteListMutation();

    const [showDiscardWarning, setShowDiscardWarning] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Local state
    // Data Fetching
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data: tasklist } = useGetTasklistQuery(Number(tasklistId));
    console.log('TASKLIST:', tasklist)
    // 1. Data Transformation: Convert API Data -> Form Shape
    // We use useMemo to prevent re-calculating this default object on every render
    const initialValues: TasklistFormValues = {
        title: tasklist?.title ?? "",
        showCompleted: tasklist?.showCompleted ?? false,
        newItemPosition: tasklist?.newItemPosition ?? "bottom",
        defaultSortOrder: tasklist?.defaultSortOrder || null,
        color: tasklist?.color ?? "#15aabf", // Provide a fallback color
        viewMode: tasklist?.viewMode ?? "detailed",
        memberIds: (tasklist?.memberIds ?? []).map(String),
        allMembers: tasklist?.allMembers ?? false,
        defaultFilters: {
            importance: tasklist?.defaultFilters?.importance ?? "all",
            assignedToId: tasklist?.defaultFilters?.assignedToId ?? null,
            time: tasklist?.defaultFilters?.time ?? "all",
        },
    };

    // 2. The Form Instance
    // Mantine form handles dirty checking, resetting, and validation internally.
    const form = useForm<TasklistFormValues>({
        initialValues,
        validate: {
            memberIds: isNotEmpty("You must assign at least one member"),
        },
    });

    const initializedRef = useRef<number | null>(null);

    useEffect(() => {
        if (!tasklist) return;

        // Only initialize when switching to a NEW tasklist
        if (initializedRef.current !== tasklist.id) {
            form.setValues(initialValues);
            form.resetDirty();
            initializedRef.current = tasklist.id;
        }
    }, [tasklist?.id]);

    // 4. Derived Helpers
    const memberOptions = useMemo(() =>
        household?.members.map((member: User) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
            firstName: `${member.firstName}`,
            profileImg: `${member.profileImg}`
        })) ?? [],
        [household]);

    const allHouseholdMemberIds = useMemo(() =>
        household?.members.map((m: User) => String(m.id)) ?? [],
        [household]);

    const usersData = useMemo(() => {
        if (isSmallScreen) return null;
        return Object.fromEntries(
            household?.members.map((member: User) => [
                String(member.id),
                { profileImg: member?.profileImg },
            ]) ?? []
        );
    }, [household, isSmallScreen]);

    // 5. Custom Handlers (Business Logic)
    // Logic for the "Select All" checkbox
    const handleToggleAllMembers = (checked: boolean) => {
        form.setFieldValue("allMembers", checked);
        if (checked) {
            form.setFieldValue("memberIds", allHouseholdMemberIds);
        } else {
            form.setFieldValue("memberIds", []);
        }
    };

    const householdMembers = household?.members;

    // Members allowed in filters' members section (based on list's assigned members)
    const allowedMembers = useMemo(() => {
        if (!householdMembers) return [];

        let filteredUsers = householdMembers;

        // Filter logic
        if (tasklist && !tasklist.allMembers) {
            const allowedIds = new Set(tasklist.memberIds?.map(Number) || []);
            filteredUsers = householdMembers.filter((m: User) => allowedIds.has(m.id));
        }

        // Map to Option structure
        return filteredUsers.map((member: User) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
            id: member.id,
            firstName: `${member.firstName}`,
            profileImg: `${member.profileImg}`
        }));

    }, [householdMembers, tasklist]);


    // Make sure filter gets switched to 'All' if selected member is removed from tasklist's assigned members
    useEffect(() => {
        const currentAssignedToId = form.values.defaultFilters.assignedToId;

        // If no one is selected in the filter, do nothing
        if (currentAssignedToId === null) return;

        // 1. If "All Members" is checked, everyone is valid.
        if (form.values.allMembers) return;

        // 2. Check if the currently filtered member is in the "memberIds" array
        // Note: memberIds are strings in the form, but assignedToId is a number
        const isValid = form.values.memberIds.includes(String(currentAssignedToId));

        // 3. If invalid, reset the default filter to null (All)
        if (!isValid) {
            form.setFieldValue('defaultFilters.assignedToId', null);
        }

    }, [form.values.allMembers, form.values.memberIds, form.values.defaultFilters.assignedToId]);

    // Logic to uncheck "Select All" if user manually deselects a person
    const handleMemberChange = (values: string[]) => {
        form.setFieldValue("memberIds", values);
        form.setFieldValue("allMembers", values.length === allHouseholdMemberIds.length);
    };

    const handleClose = () => {
        if (form.isDirty()) {
            setShowDiscardWarning(true);
        } else {
            setShowTasklistSettings?.(false);
        }
    }

    const handleDiscardConfirmation = () => {
        setShowTasklistSettings?.(false);
    }

    const handleSubmit = async () => {
        // Validate first
        if (!form.isValid()) {
            form.validate();
            return;
        }
        setIsSubmitting(true); // START loading

        // Transform form values to match your API shape
        const payload = {
            title: form.values.title,
            showCompleted: form.values.showCompleted, // <- This boolean should now work
            newItemPosition: form.values.newItemPosition,
            defaultSortOrder: form.values.defaultSortOrder,
            color: form.values.color,
            viewMode: form.values.viewMode,
            allMembers: form.values.allMembers,
            memberIds: form.values.memberIds.map(Number), // Convert strings back to numbers
            defaultFilters: {
                importance: form.values.defaultFilters.importance,
                assignedToId: form.values.defaultFilters.assignedToId,
                time: form.values.defaultFilters.time,
            },
        };

        try {
            // Replace this with your actual mutation hook
            await Promise.all([
                updateTasklist({ listId: Number(tasklist?.id), data: payload }).unwrap(),
                new Promise(resolve => setTimeout(resolve, 400)) // 800ms minimum
            ]);
            setIsSubmitting(false);
            form.resetDirty(); // Mark form as clean
        } catch (error) {
            console.error("Failed to update tasklist:", error);
            setIsSubmitting(false);
            // Optionally show error notification
        }
    };

    const resetToDefault = () => {
        if (!tasklist) return;
        form.setFieldValue("title", tasklist.title);
        form.setFieldValue("showCompleted", false);
        form.setFieldValue("newItemPosition", "bottom");
        form.setFieldValue("defaultSortOrder", "manual");
        form.setFieldValue("defaultFilters", { importance: "all", assignedToId: null, time: "all" });
        form.setFieldValue("color", "#15aabf");
        form.setFieldValue("viewMode", "detailed");
    }

    const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({ option }) => (
        !isSmallScreen && usersData ? (
            <Group gap="sm">
                <Avatar src={usersData[option.value]?.profileImg} size="sm" radius="xl" />
                <Text size="sm">{option.label}</Text>
            </Group>
        ) : (
            <Text size="sm">{option.label}</Text>
        )
    );

    useOutsideClick(tasklistTitleRef, () => {
        // Check if the CURRENT form value is empty/whitespace
        if (!form.values.title || form.values.title.trim().length === 0) {
            // Revert to the original saved in initialValues
            form.setFieldValue("title", initialValues.title);
        }
    });

    const handleArchiveList = async () => {
        try {
            await archiveList({ listId: Number(tasklistId) }).unwrap();
            setShowTasklistSettings?.(false);
            navigate("/tasklists");

            notifications.show({
                onOpen: () => {
                    // 3. Use a slightly longer delay to beat the entrance animation
                    window.setTimeout(() => {
                        const btn = document.querySelector('.notify-focus-target') as HTMLElement;
                        if (btn) {
                            btn.focus();
                        }
                    }, 150);
                },
                color: 'cyan',
                position: 'bottom-center',
                autoClose: 5000, // Give them time to click
                message: (
                    <>
                        Tasklist archived successfully.
                        <Space h="xs" />
                        <Group align="center" gap="0.5rem">
                            <Button color="cyan" variant="filled" size="compact-xs" onClick={() => navigate("/tasklists/archived")} styles={{
                                label: { fontWeight: 400 }
                            }}>View archive</Button>
                            <Button
                                color="cyan"
                                variant="filled"
                                size="compact-xs"
                                onClick={handleUndoArchive}
                                className="notify-focus-target"
                                styles={{
                                    label: { fontWeight: 400 }
                                }}
                            >
                                Undo
                            </Button>
                        </Group>
                    </>
                ),
            });

        } catch (error) {
            notifications.show({
                message: 'Error: Failed to archive list.',
                color: 'red',
            });
        }

    }

    const handleUndoArchive = async () => {
        await unarchiveList({ listId: Number(tasklistId) }).unwrap();

        notifications.show({
            onOpen: () => {
                // 3. Use a slightly longer delay to beat the entrance animation
                window.setTimeout(() => {
                    const btn = document.querySelector('.notify-focus-target') as HTMLElement;
                    if (btn) {
                        btn.focus();
                    }
                }, 150);
            },
            color: 'cyan',
            position: 'bottom-center',
            autoClose: 5000, // Give them time to click
            message: (
                <Stack
                    align="flex-start"
                    gap="xs">
                    List unarchived successfully.
                    <Button className="notify-focus-target" color="cyan" variant="filled" size="compact-xs" onClick={() => navigate(`/tasklists/${tasklist?.id}`)} styles={{
                        label: { fontWeight: 400 }
                    }}>View tasklist</Button></Stack>
            )
        })
    }

    const handleDuplicateList = async () => {
        try {
            const newList = await duplicateList({ listId: Number(tasklistId) }).unwrap()
            notifications.show({
                onOpen: () => {
                    // 3. Use a slightly longer delay to beat the entrance animation
                    window.setTimeout(() => {
                        const btn = document.querySelector('.notify-focus-target') as HTMLElement;
                        if (btn) {
                            btn.focus();
                        }
                    }, 150);
                },
                message: <Stack
                    align="flex-start"
                    gap="xs">List duplicated successfully.
                    <Button className="notify-focus-target" color="cyan" styles={{
                        label: { fontWeight: 400 }
                    }} variant="filled" size="compact-xs" onClick={() => { setShowTasklistSettings?.(false); navigate(`/tasklists/${newList.id}`) }}>View list</Button></Stack>,
                color: 'cyan',
                position: 'bottom-center',
                autoClose: 5000,
            });

        } catch (error) {
            notifications.show({
                message: 'Error: Failed to duplicate list',
                color: 'red'
            });
        }
    }

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
        })
    }

    const handleTitleBlur = () => {
        if (form.values.title.trim().length === 0) {
            form.setFieldValue("title", initialValues.title);
        }
    }

    return {
        form, // We expose the whole form object
        tasklist,
        household,
        tasklistTitleRef,
        memberOptions,
        renderMultiSelectOption,
        handleToggleAllMembers,
        handleMemberChange,
        showDiscardWarning,
        setShowDiscardWarning,
        handleClose,
        handleDiscardConfirmation,
        resetToDefault,
        isSubmitting,
        handleSubmit,
        showDeleteConfirmation,
        setShowDeleteConfirmation,
        allowedMembers,
        handleArchiveList,
        handleUndoArchive,
        handleDuplicateList,
        handleDeleteList,
        handleTitleBlur
    };
};
