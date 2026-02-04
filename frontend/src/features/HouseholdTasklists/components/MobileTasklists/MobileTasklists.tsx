import { MobileHomeNavGrid } from "@/components/MobileHomeNavGrid"
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
import { useStablePending } from "@/hooks";

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
        data: allLists = [],
        isFetching,
        isError,
        isSuccess
    } = useGetHouseholdTasklistsQuery(householdId);

    // 1. Combine everything that constitutes "Not Ready"
    const isWaiting = authLoading || (householdId !== skipToken && isFetching);

    // 2. Use your stable hook on that combined state
    const showLoader = useStablePending(isWaiting, {
        showAfterMs: 0,
        minVisibleMs: 500 // Slightly longer to prevent the "pop"
    });

    // 3. THE FIX: Guard the render early. 
    // Do not define titleComponent or anything else before this line.
    if (showLoader || (isWaiting && !isSuccess)) {
        return (
            <Center style={{ height: '100vh', width: '100vw', position: 'fixed', inset: 0, zIndex: 9999, background: 'white' }}>
                <Loader color="cyan" />
            </Center>
        );
    }

    // 4. If we get here, we are GUARANTEED to have data or an error
    if (isError) return <Text>Error loading tasks.</Text>;
    const lists = allLists.filter(list => !list.isArchived);
    if (householdId === skipToken) return null;
    if (!allLists) return null;

    const titleComponent = <div className="mobile-home-family-title">
        <h1>Tasklists</h1>
        <Tooltip.Group openDelay={500} closeDelay={100}>
            <Group gap="0.5rem" className="tasklists-title-right">
                <Tooltip events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="Archive">
                    <ActionIcon size="lg" radius="lg" variant="filled" color="white" c="rgb(5, 5, 73)" onClick={() => navigate("/tasklists/archived")}>
                        <ArchivedIcon size="1.75rem" color="currentColor" />
                    </ActionIcon>
                </Tooltip>
                <Tooltip events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="Create list">
                    <ActionIcon size="lg" radius="lg" variant="filled" color="white" c="rgb(5, 5, 73)"
                        onClick={() => open()}
                    >
                        <PlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Tooltip.Group>
    </div >
    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileHomeNavGrid activeTab={1} />
            <div className="mobile-tasklists-content">
                {lists.length === 0 && isSuccess &&
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