import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm, isNotEmpty } from "@mantine/form";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useAuthenticateQuery, type User } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useGetTasklistQuery, useUpdateTasklistMutation } from "@/store/taskSlice";
import { type MultiSelectProps, Avatar, Group, Text } from "@mantine/core";
import { useOutsideClick } from "@/hooks/useOutsideClick";

// Define the exact shape of your form values
export type TasklistFormValues = {
    title: string;
    showCompleted: boolean;
    newItemPosition: string;
    starsAtTop: boolean;
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
    setShowTasklistSettings: (val: boolean) => void;
};

export const useTasklistSettings = ({ setShowTasklistSettings }: Props) => {
    const { tasklistId } = useParams();
    const tasklistTitleRef = useRef<HTMLInputElement>(null);
    const isSmallScreen = useIsSmallScreen();
    const [updateTasklist] = useUpdateTasklistMutation();
    const [showDiscardWarning, setShowDiscardWarning] = useState(false);

    // Data Fetching
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data: tasklist } = useGetTasklistQuery(Number(tasklistId));

    // 1. Data Transformation: Convert API Data -> Form Shape
    // We use useMemo to prevent re-calculating this default object on every render
    const initialValues: TasklistFormValues = useMemo(() => ({
        title: tasklist?.title ?? "",
        showCompleted: tasklist?.showCompleted ?? false,
        newItemPosition: tasklist?.newItemPosition ?? "bottom",
        starsAtTop: tasklist?.starsAtTop ?? false,
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
    }), [tasklist]);

    // 2. The Form Instance
    // Mantine form handles dirty checking, resetting, and validation internally.
    const form = useForm<TasklistFormValues>({
        initialValues,
        validate: {
            memberIds: isNotEmpty("You must assign at least one member"),
        },
    });

    // 3. Sync State: Update form when backend data loads/changes
    // This replaces the manual useEffect mapping you had before.
    useEffect(() => {
        if (tasklist) {
            // Initialize sets the "pristine" state (what 'reset' goes back to)
            form.initialize(initialValues);
        }
    }, [initialValues]); // We depend on the memoized initialValues

    // 4. Derived Helpers
    const memberOptions = useMemo(() =>
        household?.members.map((member: User) => ({
            value: String(member.id),
            label: `${member.firstName} ${member.lastName}`,
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

    // Logic to uncheck "Select All" if user manually deselects a person
    const handleMemberChange = (values: string[]) => {
        form.setFieldValue("memberIds", values);
        form.setFieldValue("allMembers", values.length === allHouseholdMemberIds.length);
    };

    const handleClose = () => {
        if (form.isDirty()) {
            setShowDiscardWarning(true);
        } else {
            setShowTasklistSettings(false);
        }
    }

    const handleDiscardConfirmation = () => {
        setShowTasklistSettings(false);
    }

    const resetToDefault = () => {
        if (!tasklist) return;
        form.setFieldValue("title", tasklist.title);
        form.setFieldValue("showCompleted", false);
        form.setFieldValue("newItemPosition", "bottom");
        form.setFieldValue("starsAtTop", false);
        form.setFieldValue("defaultSortOrder", null);
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
    return {
        form, // We expose the whole form object
        tasklist,
        household,
        isSmallScreen,
        tasklistTitleRef,
        memberOptions,
        renderMultiSelectOption,
        handleToggleAllMembers,
        handleMemberChange,
        showDiscardWarning,
        setShowDiscardWarning,
        handleClose,
        handleDiscardConfirmation,
        updateTasklist,
        resetToDefault
    };
};
