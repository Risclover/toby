import { useState, useEffect } from "react";
import { useAuthenticateQuery, type User } from "@/store/authSlice";
import { useGetTasklistQuery } from "@/store/taskSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";

// Constants for filter logic
export const FILTER_PREFIX = {
    IMPORTANCE: 'importance:',
    MEMBER: 'member:',
    TIME: 'time:'
};

export const useTasklistOptions = () => {
    // 1. Data Fetching
    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data: tasklist } = useGetTasklistQuery(user?.householdId);

    // 2. State Definitions
    const [tasklistTitle, setTasklistTitle] = useState<string>("");
    const [newTaskDefault, setNewTaskDefault] = useState<string | null>("bottom");
    const [listHidden, setListHidden] = useState<boolean>(false);
    const [defaultSortOrder, setDefaultSortOrder] = useState<string | null>(null);
    const [assignAllMembers, setAssignAllMembers] = useState<boolean>(false);
    const [assignedMembers, setAssignedMembers] = useState<string[]>([]);

    // Default Filters State
    const [defaultFilters, setDefaultFilters] = useState<string[]>([
        `${FILTER_PREFIX.IMPORTANCE}all`,
        `${FILTER_PREFIX.MEMBER}all`,
        `${FILTER_PREFIX.TIME}all`
    ]);

    // 3. Derived Data (Helpers)
    const members = household?.members ?? [];

    const usersData = Object.fromEntries(
        members.map((member: User) => [
            `${member.firstName} ${member.lastName}`,
            { profileImg: member.profileImg, email: member.email }
        ])
    );

    const memberNames = Object.keys(usersData);

    const filterOptions = [
        // Importance
        { group: 'Importance', value: `${FILTER_PREFIX.IMPORTANCE}all`, label: 'All Importance' },
        { group: 'Importance', value: `${FILTER_PREFIX.IMPORTANCE}important`, label: 'Important Only' },
        // Time
        { group: 'Time', value: `${FILTER_PREFIX.TIME}all`, label: 'Any Time' },
        { group: 'Time', value: `${FILTER_PREFIX.TIME}past_due`, label: 'Past Due' },
        { group: 'Time', value: `${FILTER_PREFIX.TIME}today`, label: 'Today' },
        { group: 'Time', value: `${FILTER_PREFIX.TIME}tomorrow`, label: 'Tomorrow' },
        { group: 'Time', value: `${FILTER_PREFIX.TIME}week`, label: 'This Week' },
        { group: 'Time', value: `${FILTER_PREFIX.TIME}month`, label: 'This Month' },
        // Member
        { group: 'Member', value: `${FILTER_PREFIX.MEMBER}all`, label: 'All Members' },
        ...members.map((m: User) => ({
            group: 'Member',
            value: `${FILTER_PREFIX.MEMBER}${m.firstName} ${m.lastName}`,
            label: `${m.firstName} ${m.lastName}`
        }))
    ];

    const memberOptions = household.members.map((member: User) => ({
        value: String(member.id),        // MultiSelect values are strings
        label: `${member.firstName} ${member.lastName}`,
    }));


    // 4. Synchronization Effect
    // Ensures state matches DB data when it finishes loading
    useEffect(() => {
        if (tasklist) {
            setTasklistTitle(tasklist.title ?? "");
            setNewTaskDefault(tasklist.newItemPosition ?? "bottom");
            setListHidden(tasklist.autoHideWhenEmpty ?? false);
            setDefaultSortOrder(tasklist.defaultSortOrder ?? null);
            setAssignAllMembers(tasklist.allMembers ?? false);

            if (tasklist.memberIds) {
                setAssignedMembers(
                    memberOptions.map((m: { value: string, label: string }) => m.label)
                );
            }
            // Note: If you have saved default filters in DB, sync them here too
        }
    }, [tasklist]);

    // 5. Handlers
    const handleFiltersChange = (newValues: string[]) => {
        // Find the item that was just added
        const addedValue = newValues.find(v => !defaultFilters.includes(v));

        if (!addedValue) {
            // Item removed
            setDefaultFilters(newValues);
            return;
        }

        // Determine prefix group
        let activePrefix = '';
        if (addedValue.startsWith(FILTER_PREFIX.IMPORTANCE)) activePrefix = FILTER_PREFIX.IMPORTANCE;
        if (addedValue.startsWith(FILTER_PREFIX.TIME)) activePrefix = FILTER_PREFIX.TIME;
        if (addedValue.startsWith(FILTER_PREFIX.MEMBER)) activePrefix = FILTER_PREFIX.MEMBER;

        // Remove siblings with same prefix
        const distinctValues = newValues.filter(val =>
            !val.startsWith(activePrefix) || val === addedValue
        );

        setDefaultFilters(distinctValues);
    };

    const handleTitleBlur = () => {
        if (tasklistTitle?.trim().length === 0) setTasklistTitle(tasklist?.title ?? "");
    };

    return {
        // Data & Status
        isLoading: !tasklist || !household,
        household,

        // Helpers for UI
        usersData,
        memberNames,
        filterOptions,

        // State Values
        values: {
            title: tasklistTitle,
            newTaskDefault,
            listHidden,
            defaultSortOrder,
            assignAllMembers,
            assignedMembers,
            defaultFilters
        },

        // Handlers
        handlers: {
            setTitle: setTasklistTitle,
            setNewTaskDefault,
            setListHidden: (e: React.ChangeEvent<HTMLInputElement>) => setListHidden(e.currentTarget.checked),
            setDefaultSortOrder,
            toggleAssignAllMembers: () => setAssignAllMembers(prev => !prev),
            setAssignedMembers: (val: string[] | undefined) => setAssignedMembers(val || []),
            setFilters: handleFiltersChange,
            onTitleBlur: handleTitleBlur
        }
    };
};
