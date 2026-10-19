import { Stack, Text } from "@mantine/core";

import { FlatEventList } from "./FlatEventList";
import { MemberEventGroups } from "./MemberEventGroups";
import { useEventsModalList, type UseEventsModalListProps } from "../../hooks";

type Props = UseEventsModalListProps;

export const EventsModalList = (props: Props) => {
    const {
        isLoading,
        isGrouped,
        groups,
        visibleOccurrences,
        currentUserId,
        rowProps,
    } = useEventsModalList(props);

    const renderBody = () => {
        if (isLoading) return <Text size="sm">Loading...</Text>;

        if (isGrouped) {
            return (
                <MemberEventGroups
                    groups={groups}
                    currentUserId={currentUserId}
                    rowProps={rowProps}
                />
            );
        }

        return <FlatEventList occurrences={visibleOccurrences} rowProps={rowProps} />;
    };

    return (
        <div className="events-modal-list">
            <Stack gap={0} p=".5rem">
                {renderBody()}
            </Stack>
        </div>
    );
};