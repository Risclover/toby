import { MobileHomeNavGrid } from "@/component/MobileHomeNavGrid"
import { MobileLayout } from "@/layout/MobileLayout"
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdTasklistsQuery } from "@/store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklist } from "../HouseholdTasklists/HouseholdTasklist";
import { ActionIcon, Button, Group, Stack, Text } from "@mantine/core";
import { CreateTasklist } from "../HouseholdTasklists/CreateTasklist"
import { useDisclosure } from "@mantine/hooks";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useNavigate } from "react-router-dom";
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import Snackbar from '@mui/material/Snackbar';
import { Notification } from '@mantine/core';


const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const MobileTasklists = () => {
    const navigate = useNavigate();
    const { data: user, isLoading: authLoading } = useAuthenticateQuery();
    const [opened, { open, close }] = useDisclosure(false);
    const isSmall = useIsSmallScreen();
    // Gate the lists query until we have an ID
    const householdId = user?.householdId ?? skipToken;

    const {
        data: allLists = [], // Rename incoming data to 'allLists'
        isLoading,
    } = useGetHouseholdTasklistsQuery(householdId, {
        refetchOnFocus: false,
        refetchOnReconnect: false,
    });

    const lists = allLists.filter(list => !list.isArchived);

    const titleComponent = <div className="mobile-home-family-title">
        <h1>Tasklists</h1>
        <div className="tasklists-title-right">
            <ActionIcon color="white" variant="subtle"><Inventory2RoundedIcon /></ActionIcon>
            <ActionIcon
                color="white"
                variant="light"
                onClick={() => open()}
            >
                <PlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />
            </ActionIcon>
        </div>
    </div>

    if (authLoading || isLoading) return <div>Loading...</div>;

    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileHomeNavGrid activeTab={1} />
            <div className="mobile-tasklists-content">
                {lists.length === 0 &&
                    <Stack justify="center" align="center" my={isSmall ? "5rem" : ""} h={!isSmall ? "100%" : ""}>
                        <Group w="100%" justify="center" align="center">
                            <Text ta="center" styles={{ root: { lineHeight: "1.4" } }}>This household contains no tasklists. Would you like to create one?</Text>
                        </Group>
                        <Group mx="auto">
                            <Button color="cyan" variant="outline" onClick={() => navigate("/")}>Go home</Button>
                            <Button color="cyan" w="fit-content" onClick={open}>Add tasklist</Button>
                        </Group>
                    </Stack>
                }

                <div className="household-tasklists-grid">
                    {lists.map(list => (
                        <HouseholdTasklist key={list.id} list={list} />
                    ))}
                </div>
            </div>
            {opened && <CreateTasklist householdId={householdId} open={open} opened={opened} close={close} />}
        </MobileLayout>
    )
}