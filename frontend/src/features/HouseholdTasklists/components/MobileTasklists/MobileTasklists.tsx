import { MobileHomeNavGrid } from "@/components/MobileHomeNavGrid"
import { MobileLayout } from "@/layout/MobileLayout"
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdTasklistsQuery } from "@/store/householdSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import { HouseholdTasklist } from "../HouseholdTasklists/HouseholdTasklist";
import { ActionIcon, Button, Center, Group, Loader, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
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
import { useCreateTasklistModal } from "@/contexts";

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const MobileTasklists = () => {
    const navigate = useNavigate();
    const { data: user, isLoading: authLoading } = useAuthenticateQuery();

    const [opened, { open, close }] = useDisclosure(false);
    const isSmall = useIsSmallScreen(768);
    // Gate the lists query until we have an ID
    const householdId = user?.householdId ?? skipToken;
    const { openModal } = useCreateTasklistModal();
    const {
        data: allLists = [],
        isFetching,
        isError,
        isLoading,
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
                    <ActionIcon size="md" radius="lg" variant="filled" color="white" c="rgb(5, 5, 73)" onClick={() => navigate("/tasklists/archived")}>
                        <ArchivedIcon size="1.25rem" color="currentColor" />
                    </ActionIcon>
                </Tooltip>
                <Tooltip events={{ hover: true, focus: true, touch: false }} openDelay={500} closeDelay={100} label="Create list">
                    <ActionIcon size="md" radius="lg" variant="filled" color="white" c="rgb(5, 5, 73)"
                        onClick={() => openModal()}
                    >
                        <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Tooltip.Group>
    </div >
    return (
        <MobileLayout titleComponent={titleComponent}>
            <MobileHomeNavGrid activeTab={1} />
            <div className={`mobile-tasklists-content${isSmall ? " content-padding" : ""}`}>
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
                    {showLoader || (isWaiting && !isSuccess) ? Array.from({ length: 12 }).map((_, i) => <TasklistSkeleton />) : lists.map(list => (
                        <HouseholdTasklist key={list.id} list={list} />
                    ))}
                </div>
            </div>
            {opened && <CreateTasklist householdId={householdId} open={open} opened={opened} close={close} />}
        </MobileLayout>
    )
}


const TasklistSkeleton = () => {
    return (
        <div className="tasklist-card">
            <div className="mobile-tasklist-card-header">
                <div className="skeleton-header-top">
                    <Skeleton h={16} w={200} />
                    <div className="skeleton-header-top-right">
                        <Skeleton h={20} w={20} />
                        <Skeleton h={20} w={20} />
                    </div>
                </div>
                <div className="skeleton-progress">
                    <Skeleton h={8} w="100%" />
                    <Skeleton h={8} w={50} />
                </div>
            </div>
            <div className="mobile-tasklist-card-body">
                <div className="skeleton-tasklist">
                    <div className="skeleton-task">
                        <Skeleton circle h={16} w={16} />
                        <Skeleton h={10} w={200} />
                    </div>
                    <div className="skeleton-task">
                        <Skeleton circle h={16} w={16} />
                        <Skeleton h={10} w={200} />
                    </div>
                    <div className="skeleton-task">
                        <Skeleton circle h={16} w={16} />
                        <Skeleton h={10} w={200} />
                    </div>
                </div>
            </div>
            <div className="mobile-tasklist-card-footer">
                <div className="skeleton-footer-left">
                    <Skeleton h={20} w={75} />
                </div>
                <div className="skeleton-footer-right">
                    <Skeleton h={16} w={100} />
                </div>
            </div>
        </div>
    )
}