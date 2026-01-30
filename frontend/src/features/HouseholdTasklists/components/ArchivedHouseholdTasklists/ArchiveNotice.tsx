import { ArchivedIcon } from '@/assets/icons/ArchivedIcon';
import { useUnarchiveListMutation } from '@/store/taskSlice';
import { Alert, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

export const ArchiveNotice = ({ tasklistId }: { tasklistId: number }) => {
    const navigate = useNavigate();
    const [unarchiveList] = useUnarchiveListMutation();

    const handleUndoArchive = async () => {
        await unarchiveList({ listId: Number(tasklistId) }).unwrap();

        notifications.show({
            title: 'List unarchived successfully!',
            color: 'teal',
            position: 'bottom-center',
            autoClose: 5000, // Give them time to click
            message: (
                <Button variant="subtle" size="compact-xs" onClick={() => navigate(`/tasklists/${tasklistId}`)}>View tasklist</Button>
            )
        })
    }

    return (
        <Alert
            variant="light"
            color="yellow"
            icon={<ArchivedIcon />}
        >
            <strong>Archived</strong>: Read-only mode active. Actions are disabled until this list is <Button variant="transparent" p={4} onClick={handleUndoArchive} style={{ height: 'auto', verticalAlign: 'baseline' }}>restored</Button>.
        </Alert>
    );
};