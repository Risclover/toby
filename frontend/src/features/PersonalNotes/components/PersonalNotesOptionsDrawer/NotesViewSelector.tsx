import { Box, Checkbox, Flex, Group, rem, Stack, Text } from "@mantine/core";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import type { ViewOption } from "../../hooks/useNotesFilter";

function MiniLine({ width, height, opacity = 1, marginTop, color = "currentColor" }: {
    width: string | number;
    height: string | number;
    opacity?: number;
    marginTop?: string | number;
    color?: string;
}) {
    return (
        <Box style={{
            width,
            height,
            backgroundColor: color,
            opacity,
            marginTop,
            borderRadius: rem(2),
        }} />
    );
}

function MiniPill() {
    return (
        <Box style={{
            height: rem(8),
            width: rem(30),
            borderRadius: rem(999),
            backgroundColor: "rgb(5, 5, 73)",
            opacity: 0.6,
        }} />
    );
}

function ListNoteCard({ faded }: { faded?: boolean }) {
    return (
        <Box
            px={8}
            py={6}
            style={{
                borderBottom: "1px solid var(--mantine-color-gray-2)",
                color: "var(--mantine-color-gray-6)",
                opacity: faded ? 0.4 : 1,
            }}
        >
            <MiniLine width="70%" height={6} opacity={0.7} />
            <MiniLine width="40%" height={4} opacity={0.35} marginTop={5} />
            <Box mt={5}><MiniPill /></Box>
        </Box>
    );
}

function GridNoteCard({ faded }: { faded?: boolean }) {
    return (
        <Box style={{
            border: "1px solid var(--mantine-color-gray-3)",
            borderTop: "3px solid rgb(5, 5, 73)",
            borderRadius: "var(--mantine-radius-sm)",
            overflow: "hidden",
            opacity: faded ? 0.4 : 1,
        }}>
            <Box px={8} py={6} style={{ color: "var(--mantine-color-gray-6)" }}>
                <MiniLine width="70%" height={6} opacity={0.7} />
                <MiniLine width="40%" height={4} opacity={0.35} marginTop={5} />
                <Box style={{ borderTop: "1px solid var(--mantine-color-gray-2)", margin: "5px 0" }} />
                <MiniLine width="90%" height={4} opacity={0.3} />
                <MiniLine width="65%" height={4} opacity={0.3} marginTop={3} />
                <Box mt={5}><MiniPill /></Box>
            </Box>
        </Box>
    );
}

function PreviewWindow({ label, onClick, onKeyDown, activeView, children }: {
    label: string;
    onClick: () => void;
    onKeyDown: (e: any) => void;
    activeView: string | undefined;
    children: React.ReactNode;
}) {
    return (
        <Stack gap="0.25rem">
            <Box
                style={{
                    border: activeView === label.toLowerCase()
                        ? "2px solid var(--notes-color, rgb(5, 5, 73))"
                        : "2px solid transparent",
                    borderRadius: "var(--mantine-radius-md)",
                    padding: "2px",
                    cursor: "pointer",
                }}
                onClick={onClick}
            >
                <Box style={{
                    width: rem(190),
                    height: rem(150),
                    border: label === "List" ? "1px solid var(--mantine-color-gray-3)" : "",
                    borderRadius: "var(--mantine-radius-md)",
                    backgroundColor: "white",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    {children}
                </Box>
            </Box>
            <Group gap="0.5rem" align="center" ml={5}>
                <Checkbox
                    onChange={onClick}
                    onKeyDown={onKeyDown}
                    color="var(--notes-color, rgb(5, 5, 73))"
                    checked={activeView === label.toLowerCase()}
                    size="xs"
                    radius="xl"
                />
                <div className="notes-view-selector-label">{label}</div>
            </Group>
        </Stack>
    );
}

export function NotesViewSelector({ activeView, setActiveView }: {
    activeView: ViewOption;
    setActiveView: (val: ViewOption) => void;
}) {
    const isSmallScreen = useIsSmallScreen();

    const handleKeyDown = (view: ViewOption) => (e: any) => {
        if (e.key === " " || e.key === "Enter") setActiveView(view);
    };

    return (
        <Flex m="auto" gap={isSmallScreen ? 20 : 30} justify="center" wrap="wrap">
            <PreviewWindow
                label="Grid"
                activeView={activeView}
                onClick={() => setActiveView("grid")}
                onKeyDown={handleKeyDown("grid")}
            >
                <Flex direction="column" gap={4} p={0} style={{ flex: 1 }}>
                    <GridNoteCard />
                    <GridNoteCard />
                    <GridNoteCard faded />
                    <GridNoteCard faded />
                </Flex>
            </PreviewWindow>
            <PreviewWindow
                label="List"
                activeView={activeView}
                onClick={() => setActiveView("list")}
                onKeyDown={handleKeyDown("list")}
            >
                <ListNoteCard />
                <ListNoteCard />
                <ListNoteCard />
                <ListNoteCard faded />
            </PreviewWindow>
        </Flex>
    );
}