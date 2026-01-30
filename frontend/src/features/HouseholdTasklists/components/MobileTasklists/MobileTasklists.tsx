import { MobileHomeNavGrid } from "@/component/MobileHomeNavGrid"
import { MobileLayout } from "@/layout/MobileLayout"
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdTasklistsQuery } from "@/store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklist } from "../HouseholdTasklists/HouseholdTasklist";
import { ActionIcon, Button, Center, Group, Loader, Stack, Text, Tooltip } from "@mantine/core";
import { CreateTasklist } from "../HouseholdTasklists/CreateTasklist"
import { useDisclosure } from "@mantine/hooks";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useNavigate } from "react-router-dom";
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import Snackbar from '@mui/material/Snackbar';
import { Notification } from '@mantine/core';
import { Tasklist } from "../HouseholdTasklists/Tasklist";
import "../../styles/Tasklist.css";
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import { ArchivedIcon } from "@/assets/icons/ArchivedIcon";

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
        <Tooltip.Group openDelay={500} closeDelay={100}>
            <Group gap="0.5rem" className="tasklists-title-right">
                <Tooltip events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="Archive">
                    <ActionIcon size="lg" radius="md" variant="filled" color="white" c="rgb(5, 5, 73)" onClick={() => navigate("/tasklists/archived")}>
                        <ArchivedIcon />
                    </ActionIcon>
                </Tooltip>
                <Tooltip events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="New list">
                    <ActionIcon size="lg" radius="md" variant="filled" color="white" c="rgb(5, 5, 73)"
                        onClick={() => open()}
                    >
                        <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Tooltip.Group>
    </div >

    if (authLoading || isLoading) return <Center h="100vh"><Loader color="cyan" style={{
        transition: 'opacity 200ms ease-in',
        opacity: isLoading ? 1 : 0,
        transitionDelay: '300ms' // Only starts appearing after 300ms
    }} /></Center>;

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