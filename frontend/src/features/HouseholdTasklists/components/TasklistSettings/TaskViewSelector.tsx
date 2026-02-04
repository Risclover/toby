import { Box, Checkbox, Flex, Group, rem, Stack, Text } from "@mantine/core";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { StarIcon } from "@/assets/icons/StarIcon";

function MiniLine({ width, height, opacity = 1, marginTop, color = 'currentColor' }: { width: string | number; height: string | number; opacity?: number; marginTop?: string | number; color?: string; }) {
    return (
        <Box
            style={{
                width,
                height,
                backgroundColor: color, // Uses parent text color
                opacity,
                marginTop,
                borderRadius: rem(2)
            }}
        />
    );
}

function MiniCircle({ size }: { size: string | number }) {
    return (
        <Box
            style={{
                width: size,
                height: size,
                border: '1.5px solid currentColor', // Hollow circle style
                borderRadius: '50%',
                flexShrink: 0,
                opacity: 0.4,
            }}
        />
    );
}

// --- The Task Cards ---

function DetailedTask() {
    return (
        <Box py={6} px={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-6)' }}>
            <Flex align="flex-start" gap={6}>

                {/* Checkbox (Top aligned) */}
                <MiniCircle size={10} />

                {/* Middle Content */}
                <Stack gap={4} style={{ flex: 1 }}>
                    {/* Main Task Text (Skinnier height=6) */}
                    <MiniLine width="85%" height={6} opacity={0.6} marginTop="2px" />

                    {/* Metadata Row */}
                    <Flex gap={4} align="center">
                        <MiniLine width={8} height={8} opacity={0.7} color="var(--tasklist-color)" /> {/* Icon Box */}
                        <MiniLine width={24} height={4} opacity={0.4} /> {/* Text Line */}
                        <Box w={4} /> {/* Spacer */}
                        <MiniLine width={8} height={8} opacity={0.7} color="var(--tasklist-color)" /> {/* Icon Box */}
                        <MiniLine width={24} height={4} opacity={0.4} /> {/* Text Line */}
                    </Flex>
                </Stack>

                {/* Real Star Icon (Top aligned) */}
                <Text c="var(--tasklist-color)"><StarIcon size={10} /></Text>
            </Flex>
        </Box>
    );
}

function CompactTask() {
    return (
        <Box py={4} px={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-6)' }}>
            <Flex align="center" gap={10}>
                {/* Checkbox */}
                <MiniCircle size={10} />

                {/* Task Text */}
                <Box style={{ flex: 1 }}>
                    <MiniLine width="65%" height={6} opacity={0.6} />
                </Box>

                {/* Real Star Icon */}
                <Text c="var(--tasklist-color)"><StarIcon size={10} /></Text>
            </Flex>
        </Box>
    );
}

// --- Main Container ---

function PreviewWindow({ label, onClick, onKeyDown, activeTaskDisplay, children }: { label: string; onKeyDown: (e: any) => void; onClick: () => void; activeTaskDisplay: string | undefined; children: React.ReactNode }) {
    console.log(activeTaskDisplay === label)
    return (
        <Stack gap="0.25rem">
            <Box style={{
                border: activeTaskDisplay === label.toLowerCase() ? "2px solid var(--tasklist-color)" : "2px solid transparent",
                borderRadius: "var(--mantine-radius-md)",
                padding: "2px",
            }}
                onClick={onClick}>
                <Box
                    style={{
                        width: rem(180),
                        height: rem(125),
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {children}
                </Box>
            </Box>
            <Group gap="0.5rem" align="center" ml={5}>
                <Checkbox onChange={onClick} onKeyDown={onKeyDown} color="var(--tasklist-color)" checked={activeTaskDisplay === label.toLowerCase()} size="xs" radius="xl" />
                <Text size="xs" fw={500} c="black" mt={1}>{label}</Text>
            </Group>
        </Stack>
    );
}

export function TaskViewSelector({ activeTaskDisplay, setActiveTaskDisplay }: { activeTaskDisplay: string | undefined; setActiveTaskDisplay: (val: string) => void }) {
    const isSmallScreen = useIsSmallScreen();
    return (
        <Flex m="auto" gap={isSmallScreen ? 20 : 30} justify="center" wrap="wrap">
            <PreviewWindow label="Detailed" onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { setActiveTaskDisplay("detailed") } }} onClick={() => setActiveTaskDisplay("detailed")} activeTaskDisplay={activeTaskDisplay}>
                <DetailedTask />
                <DetailedTask />
                <DetailedTask />
                <Box style={{ opacity: "0.5" }} ><DetailedTask /></Box>
            </PreviewWindow>

            <PreviewWindow label="Compact" onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { setActiveTaskDisplay("compact") } }} onClick={() => setActiveTaskDisplay("compact")} activeTaskDisplay={activeTaskDisplay}>
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <CompactTask />
                <Box style={{ opacity: "0.5" }} ><CompactTask /></Box>
            </PreviewWindow>
        </Flex>
    );
}