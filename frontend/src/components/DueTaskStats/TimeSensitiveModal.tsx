// TimeSensitiveModal.tsx
import { Box, Button, Group, Modal, ScrollArea, Tabs, Transition } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useEffect, useRef, useState } from "react"
import { useAuthenticateQuery, useGetUserTaskStatsQuery, useCompleteTaskMutation, useDeleteTaskMutation } from "@/store"
import { useIsSmallScreen } from "@/hooks"
import { TimeSensitiveTasksTab } from "./TimeSensitiveTasksTab"
import { DeleteConfirmation } from "@/features"
import { useDisclosure } from "@mantine/hooks"
import { MassDeleteConfirmation } from "./MassDeleteConfirmation"
import { KittyNotification } from "../KittyNotification"
import { KittyIcons } from "@/assets"

type TaskItem = {
    id: number
    title: string
    due_date: string
    tasklist_id: number
    tasklist_title: string
}

type Props = {
    opened: boolean
    close: () => void
    activeTab?: string
}

export const TimeSensitiveModal = ({ opened, close, activeTab }: Props) => {
    const { data: user } = useAuthenticateQuery()
    const { data: tasks } = useGetUserTaskStatsQuery(user?.id, { skip: !user?.id })
    const isSmall = useIsSmallScreen(425)

    const [completeTask] = useCompleteTaskMutation()
    const [deleteTask] = useDeleteTaskMutation()

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [checkedIds, setCheckedIds] = useState<{
        overdue: Set<number>
        due_today: Set<number>
        due_soon: Set<number>
    }>({
        overdue: new Set(),
        due_today: new Set(),
        due_soon: new Set(),
    })

    const getCheckedIds = (tab: string) => checkedIds[tab as keyof typeof checkedIds]
    const setCheckedIdsForTab = (tab: string, ids: Set<number>) => {
        setCheckedIds(prev => ({ ...prev, [tab]: ids }))
    }

    const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set())
    const [pendingCompleteIds, setPendingCompleteIds] = useState<Set<number>>(new Set())
    const [currentTab, setCurrentTab] = useState(activeTab ?? "overdue")

    const pendingDeleteRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingCompleteRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (opened) {
            setCurrentTab(activeTab ?? "overdue")
            setCheckedIds({ overdue: new Set(), due_today: new Set(), due_soon: new Set() })
        }
    }, [opened, activeTab])

    if (!tasks) return null

    const getList = (tab: string): TaskItem[] => {
        if (tab === "due_today") return tasks.due_today
        if (tab === "due_soon") return tasks.due_soon
        return tasks.overdue
    }

    const list = getList(currentTab)

    const getSelectedCount = (tab: string): number =>
        getCheckedIds(tab).size

    // Now your current tab logic uses tab-specific state
    const currentCheckedIds = getCheckedIds(currentTab)
    const allChecked = list.length > 0 && currentCheckedIds.size === list.length
    const indeterminate = currentCheckedIds.size > 0 && !allChecked
    const visibleTasks = list.filter(t => !pendingDeleteIds.has(t.id) && !pendingCompleteIds.has(t.id))

    const handleSelectAll = () => {
        setCheckedIdsForTab(
            currentTab,
            allChecked ? new Set() : new Set(visibleTasks.map(t => t.id))
        )
    }

    const handleToggle = (id: number) => {
        const currentSet = getCheckedIds(currentTab)
        const next = new Set(currentSet)
        next.has(id) ? next.delete(id) : next.add(id)
        setCheckedIdsForTab(currentTab, next)
    }

    const handleMassDelete = async () => {
        const ids = new Set(getCheckedIds(currentTab))
        if (ids.size === 0 || list.length === 0) return

        setPendingDeleteIds(ids)
        setCheckedIdsForTab(currentTab, new Set())

        try {
            const selected = list.filter(t => ids.has(t.id))
            await Promise.all(
                selected.map(t => deleteTask({ taskId: t.id, listId: t.tasklist_id }))
            )
            KittyNotification({
                title: "Tasks deleted",
                message: "You've successfully irradicated some time-sensitive tasks.",
                icon: KittyIcons.Dance,
                color: "rgb(154, 221, 166)"
            })
        } catch (error) {
            setPendingDeleteIds(new Set())
            KittyNotification({
                title: "Oh no! Your tasks are being stubborn.",
                message: "That's weird - your tasks weren't deleted for some reason. Try again.",
                icon: KittyIcons.Grumpy,
                color: "rgb(234, 118, 118)"
            })
        }

        setShowDeleteConfirmation(false)
    }

    const handleMassComplete = () => {
        const ids = new Set(getCheckedIds(currentTab))
        if (ids.size === 0 || list.length === 0) return

        setPendingCompleteIds(ids)
        setCheckedIdsForTab(currentTab, new Set())

        pendingCompleteRef.current = setTimeout(async () => {
            const selected = list.filter(t => ids.has(t.id))
            await Promise.all(
                selected.map(t =>
                    completeTask({ taskId: t.id, listId: t.tasklist_id, completed: true })
                )
            )
        }, 5000)

        const notifId = notifications.show({
            message: (
                <Group justify="space-between" align="center">
                    <span>{`Completed ${ids.size} ${ids.size === 1 ? "task" : "tasks"}`}</span>
                    <Button
                        size="xs"
                        color="rgb(5,5,73)"
                        variant="light"
                        onClick={() => {
                            if (pendingCompleteRef.current) clearTimeout(pendingCompleteRef.current)
                            setPendingCompleteIds(new Set())
                            notifications.hide(notifId)
                        }}
                    >
                        Undo
                    </Button>
                </Group>
            ),
            autoClose: 5000,
            withCloseButton: false,
            color: "rgb(5, 5, 73)",
        })
    }

    return (
        <Modal
            fullScreen={isSmall}
            size="lg"
            opened={opened}
            onClose={close}
            radius="md"
            title="Time-Sensitive Tasks"
            styles={{
                body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: "hidden" },
                content: { overflow: "hidden", maxHeight: "100%", display: "flex", flexDirection: "column" },
            }}
        >
            <Tabs
                value={currentTab}
                onChange={(value) => setCurrentTab(value ?? "overdue")}
                style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}
            >
                <Tabs.List styles={{ list: { padding: "0 1rem" } }}>
                    <Tabs.Tab value="overdue" color="red.7" className="tab-overdue">
                        Overdue
                    </Tabs.Tab>
                    <Tabs.Tab value="due_today" color="orange.7" className="tab-today">
                        Due Today
                    </Tabs.Tab>
                    <Tabs.Tab value="due_soon" color="blue.7" className="tab-soon">
                        Due Soon
                    </Tabs.Tab>
                </Tabs.List>

                <TimeSensitiveTasksTab
                    tabValue="overdue"
                    emptyMsg="You have no overdue tasks - good job!"
                    tasks={tasks.overdue}
                    checkedIds={getCheckedIds("overdue")}
                    allChecked={allChecked}
                    indeterminate={indeterminate}
                    visibleTasks={visibleTasks}
                    onSelectAll={handleSelectAll}
                    onToggle={handleToggle}
                />
                <TimeSensitiveTasksTab
                    tabValue="due_today"
                    emptyMsg="No tasks due today."
                    tasks={tasks.due_today}
                    checkedIds={getCheckedIds("due_today")}
                    allChecked={allChecked}
                    indeterminate={indeterminate}
                    visibleTasks={visibleTasks}
                    onSelectAll={handleSelectAll}
                    onToggle={handleToggle}
                />
                <TimeSensitiveTasksTab
                    tabValue="due_soon"
                    emptyMsg="No tasks due this week."
                    tasks={tasks.due_soon}
                    checkedIds={getCheckedIds("due_soon")}
                    allChecked={allChecked}
                    indeterminate={indeterminate}
                    visibleTasks={visibleTasks}
                    onSelectAll={handleSelectAll}
                    onToggle={handleToggle}
                />
            </Tabs>

            <Modal.Header
                component={'footer'} pos={'sticky'} bottom={0} style={{ borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}
            >
                <Group gap=".5rem" justify="flex-end" w="100%">
                    <Button
                        radius="sm"
                        size="sm"
                        p=".5rem 1rem"
                        h="auto"
                        variant="outline"
                        fw={500}
                        color="red"
                        onClick={() => setShowDeleteConfirmation(true)}
                        disabled={getSelectedCount(currentTab) === 0}
                    >
                        Delete
                    </Button>
                    <Button
                        radius="sm"
                        size="sm"
                        p=".5rem 1rem"
                        h="auto"
                        variant="filled"
                        fw={500}
                        color="rgb(5, 5, 73)"
                        onClick={handleMassComplete}
                        disabled={getSelectedCount(currentTab) === 0}
                    >
                        Complete
                    </Button>
                </Group>
            </Modal.Header>
            {/* <DeleteConfirmation
                modalTitle="Bulk delete tasks"
                itemName={`${list.length}`}
                itemType="tasks"
                opened={showDeleteConfirmation}
                setShowDeleteConfirmation={setShowDeleteConfirmation}
                handleDeleteItem={handleMassDelete}
            /> */}

            <MassDeleteConfirmation
                opened={showDeleteConfirmation}
                close={() => setShowDeleteConfirmation(false)}
                count={getSelectedCount(currentTab)}
                handleDelete={handleMassDelete}
            />
        </Modal>
    )
}