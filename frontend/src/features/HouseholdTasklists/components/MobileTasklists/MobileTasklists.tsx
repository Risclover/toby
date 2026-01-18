import { MobileHomeNavGrid } from "@/component/MobileHomeNavGrid"
import { MobileLayout } from "@/layout/MobileLayout"
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdTasklistsQuery } from "@/store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklist } from "../HouseholdTasklists/HouseholdTasklist";
import { useState } from "react";
import { Button } from "@mantine/core";
import { CreateTasklist } from "../HouseholdTasklists/CreateTasklist"
import { useDisclosure } from "@mantine/hooks";

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const MobileTasklists = () => {
    const { data: user, isLoading: authLoading } = useAuthenticateQuery();
    const [opened, { open, close }] = useDisclosure(false);

    // Gate the lists query until we have an ID
    const householdId = user?.householdId ?? skipToken;

    const {
        data: lists = [],
        isLoading,     // true only for the *first* load
        isFetching,    // true for background refetches
    } = useGetHouseholdTasklistsQuery(householdId, {
        // Optional: reduce surprise refetches
        refetchOnFocus: false,
        refetchOnReconnect: false,
    });

    const titleComponent = <div className="mobile-home-family-title">
        <h1>Tasklists</h1>
        <Button
            color="transparent"
            radius="md"
            h={40}
            w={40}
            type="button"
            onClick={() => open()}
            className="mobile-add-tasklist-btn"
            aria-label="Add new tasklist"
        >
            <PlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />
        </Button>
    </div>

    if (authLoading || isLoading) return <div>Loading...</div>;

    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileHomeNavGrid activeTab={1} />
            <div className="mobile-tasklists-content">
                {isFetching && <div className="subtle-loading">Refreshing…</div>}

                <div className="household-tasklists-grid">
                    {lists.map(list => (
                        <HouseholdTasklist key={list.id} list={list} />
                    ))}
                </div>
            </div>
            {opened && <CreateTasklist householdId={householdId} opened={opened} close={close} />}
        </MobileLayout>
    )
}