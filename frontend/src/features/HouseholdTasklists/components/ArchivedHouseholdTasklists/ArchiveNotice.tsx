import { Alert, Button, Text } from '@mantine/core';
import { ArchivedIcon } from '@/assets';
import { useUndoArchive } from '../../hooks';

export const ArchiveNotice = ({ tasklistId }: { tasklistId: number }) => {
    const { handleUndoArchive } = useUndoArchive({ tasklistId });
    const restoreButton = <Button variant="transparent" p={0} pl={1} fw={500} onClick={handleUndoArchive} style={{ height: 'auto', verticalAlign: 'baseline' }} >restored</Button>

    return (
        <Alert
            variant="light"
            radius="xs"
            color="rgba(204, 143, 0, 1)"
            bg="rgb(255, 249, 225)"
            title="This tasklist was archived."
            icon={<ArchivedIcon size="" color="currentColor" />}
            styles={{
                root: { boxShadow: "var(--mantine-shadow-xs)", border: "1px solid transparent", fontFamily: "Source Sans 3", },
                title: { fontFamily: "Alan Sans", fontWeight: 500 },
                message: { lineHeight: 1.3 }
            }}
        >
            Read-only mode active. Actions are disabled until this list is {restoreButton}.
        </Alert >
    );
};