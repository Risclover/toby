import { Alert, Button } from '@mantine/core';
import { ArchivedIcon } from '@/assets';
import { useUndoArchive } from '../../hooks';

export const ArchiveNotice = ({ tasklistId }: { tasklistId: number }) => {
    const { handleUndoArchive } = useUndoArchive({ tasklistId });
    const restoreButton = <Button variant="transparent" p={4} onClick={handleUndoArchive} style={{ height: 'auto', verticalAlign: 'baseline' }} p={0}>restored</Button>

    return (
        <Alert
            variant="light"
            radius="xs"
            color="yellow"
            icon={<ArchivedIcon />}
            styles={{
                root: { borderBottom: "1px solid var(--mantine-color-gray-3)" }
            }}
        >
            <strong>This tasklist was archived.</strong> Read-only mode active. Actions are disabled until this list is {restoreButton}.
        </Alert>
    );
};