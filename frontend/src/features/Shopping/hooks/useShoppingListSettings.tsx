// useShoppingListSettings.ts
import { useNavigate } from "react-router-dom";
import { useMemo, useRef } from "react";
import { isNotEmpty } from "@mantine/form";
import { Avatar, Button, Group, Stack, Text, type MultiSelectProps } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useHousehold } from "@/hooks/useHousehold";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import {
    useEditShoppingListMutation,
    useArchiveShoppingListMutation,
    useUnarchiveShoppingListMutation,
    useDuplicateShoppingListMutation,
    useDeleteShoppingListMutation,
    useCheckAllItemsMutation,
    useUncheckAllItemsMutation,
    type ShoppingList,
    type User,
    useUpdateListOptionsMutation,
} from "@/store";

export type ShoppingListFormValues = {
    title: string;
    color: string;
    defaultSort: "created" | "alpha";
    groupByCategory: boolean;
    allMembers: boolean;
    memberIds: string[];
};

const SHOPPING_LIST_DEFAULT_VALUES: ShoppingListFormValues = {
    title: "",
    color: "#15aabf",
    defaultSort: "created",
    groupByCategory: true,
    allMembers: false,
    memberIds: [],
};

type Props = {
    list: ShoppingList;
    onClose: () => void;
};

export const useShoppingListSettings = ({ list, onClose }: Props) => {
    const navigate = useNavigate();
    const isSmallScreen = useIsSmallScreen();
    const titleRef = useRef<HTMLInputElement>(null);

    const { data: household } = useHousehold();
    const [editShoppingList] = useEditShoppingListMutation();
    const [archiveList] = useArchiveShoppingListMutation();
    const [unarchiveList] = useUnarchiveShoppingListMutation();
    const [duplicateList] = useDuplicateShoppingListMutation();
    const [deleteList] = useDeleteShoppingListMutation();
    const [checkAll] = useCheckAllItemsMutation();
    const [uncheckAll] = useUncheckAllItemsMutation();
    const [updateListOptions] = useUpdateListOptionsMutation();

    const initialValues: ShoppingListFormValues = {
        title: list.title,
        color: list.color,
        defaultSort: list.defaultSort,
        groupByCategory: list.groupByCategory,
        allMembers: list.allMembers,
        memberIds: list.memberIds.map(String),
    };

    const committedValues = useRef<ShoppingListFormValues>(initialValues);

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
    } = useSettingsModal<ShoppingListFormValues>({
        entityId: list.id,
        initialValues,
        defaultValues: { ...SHOPPING_LIST_DEFAULT_VALUES, title: list.title },
        validate: {
            title: (value) => value.trim().length === 0 ? "Title is required" : null,
            memberIds: isNotEmpty("You must assign at least one member"),
        },
        onSubmit: async (values) => {
            await Promise.all([
                editShoppingList({
                    listId: list.id,
                    householdId: household!.id,
                    title: values.title,
                    color: values.color,
                    allMembers: values.allMembers,
                    memberIds: values.memberIds.map(Number),
                }).unwrap(),
                updateListOptions({
                    listId: list.id,
                    defaultSort: values.defaultSort ?? undefined,
                    groupByCategory: values.groupByCategory,
                }).unwrap(),
            ]);
            committedValues.current = values;
        },
        onClose,
    });

    const handleResetToDefaults = () => {
        form.setValues({
            ...SHOPPING_LIST_DEFAULT_VALUES,
            title: form.values.title,
        });
    };

    // ── Member data ──────────────────────────────────────────────────────────
    const allHouseholdMemberIds = useMemo(
        () => household?.members.map((m: User) => String(m.id)) ?? [],
        [household]
    );

    const memberOptions = useMemo(
        () =>
            household?.members.map((m: User) => ({
                value: String(m.id),
                label: `${m.firstName} ${m.lastName}`,
                firstName: m.firstName,
                profileImg: m.profileImg,
            })) ?? [],
        [household]
    );

    const usersData = useMemo(() => {
        return Object.fromEntries(
            household?.members.map((m: User) => [String(m.id), { profileImg: m.profileImg }]) ?? []
        );
    }, [household, isSmallScreen]);

    // ── Member handlers ──────────────────────────────────────────────────────
    const handleToggleAllMembers = (checked: boolean) => {
        form.setFieldValue("allMembers", checked);
        form.setFieldValue("memberIds", checked ? allHouseholdMemberIds : []);
    };

    const handleMemberChange = (values: string[]) => {
        form.setFieldValue("memberIds", values);
        form.setFieldValue("allMembers", values.length === allHouseholdMemberIds.length);
    };

    const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({ option }) =>
        usersData ? (
            <Group gap="sm">
                <Avatar src={usersData[option.value]?.profileImg} size="sm" radius="xl" />
                <Text size="sm">{option.label}</Text>
            </Group>
        ) : (
            <Text size="sm">{option.label}</Text>
        );

    // ── Title blur ───────────────────────────────────────────────────────────
    const handleTitleBlur = () => {
        if (!form.values.title.trim()) {
            form.setFieldValue("title", list.title);
        }
    };

    // ── Archive ──────────────────────────────────────────────────────────────
    const handleArchiveList = async () => {
        try {
            await archiveList({ listId: list.id, householdId: household!.id }).unwrap();
            onClose();
            navigate("/shopping");
            notifications.show({
                color: list.color,
                position: "bottom-center",
                autoClose: 5000,
                message: (
                    <Stack align="flex-start" gap="xs">
                        List archived successfully.
                        <Button
                            color={list.color}
                            variant="filled"
                            size="compact-xs"
                            styles={{ label: { fontWeight: 400 } }}
                            onClick={handleUndoArchive}
                        >
                            Undo
                        </Button>
                    </Stack>
                ),
            });
        } catch {
            notifications.show({ message: "Failed to archive list.", color: "red" });
        }
    };

    const handleUndoArchive = async () => {
        await unarchiveList({ listId: list.id, householdId: household!.id }).unwrap();
        notifications.show({
            color: list.color,
            position: "bottom-center",
            autoClose: 5000,
            message: "List restored successfully.",
        });
    };

    // ── Duplicate ────────────────────────────────────────────────────────────
    const handleDuplicateList = async () => {
        try {
            const newList = await duplicateList({ listId: list.id, householdId: household!.id }).unwrap();
            notifications.show({
                color: list.color,
                position: "bottom-center",
                autoClose: 5000,
                message: (
                    <Stack align="flex-start" gap="xs">
                        List duplicated successfully.
                        <Button
                            color={list.color}
                            variant="filled"
                            size="compact-xs"
                            styles={{ label: { fontWeight: 400 } }}
                            onClick={() => {
                                onClose();
                                navigate(`/shopping/${newList.id}`);
                            }}
                        >
                            View list
                        </Button>
                    </Stack>
                ),
            });
        } catch (error) {
            console.error(error)
            notifications.show({ message: "Failed to duplicate list.", color: "red" });
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteList = async () => {
        await deleteList({ listId: list.id, householdId: household!.id }).unwrap();
        setShowDeleteConfirmation(false);
        onClose();
        navigate("/shopping");
        notifications.show({
            message: "Shopping list deleted successfully.",
            color: list.color,
            position: "bottom-center",
            autoClose: 5000,
        });
    };

    // ── Check/Uncheck all ────────────────────────────────────────────────────
    const handleCheckAll = async () => {
        try {
            await checkAll({ listId: list.id }).unwrap();
            notifications.show({ message: "All items checked.", color: list.color, position: "bottom-center" });
        } catch {
            notifications.show({ message: "Failed to check all items.", color: "red" });
        }
    };

    const handleUncheckAll = async () => {
        try {
            await uncheckAll({ listId: list.id }).unwrap();
            notifications.show({ message: "All items unchecked.", color: list.color, position: "bottom-center" });
        } catch {
            notifications.show({ message: "Failed to uncheck all items.", color: "red" });
        }
    };

    return {
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
        titleRef,
        memberOptions,
        renderMultiSelectOption,
        handleToggleAllMembers,
        handleMemberChange,
        handleTitleBlur,
        handleArchiveList,
        handleUndoArchive,
        handleDuplicateList,
        handleDeleteList,
        handleCheckAll,
        handleUncheckAll,
        household,
        list,
        initialValues,
        committedValues,
    };
};