import { Announcements } from "@/features/Announcements/components/Announcements";
import AnnouncementsTabOptimistic from "@/features/Announcements/components/AnnouncementsTabOptimistic";
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { Button, FloatingIndicator, Tabs } from "@mantine/core";
import { useState } from "react"

export const MobileHomeNoticeBoard = () => {
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [roofRef, setRoofRef] = useState<HTMLDivElement | null>(null);
    const [value, setValue] = useState<string>("reminders");

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);

    const [controlsRef, setControlsRef] = useState<Record<string, HTMLButtonElement | null>>({});

    const setControlRef = (val: string) => (node: HTMLButtonElement) => {
        controlsRef[val] = node;
        setControlsRef(controlsRef);
    }

    return (
        <div className="mobile-home-notice-board">
            <div className="mobile-home-notice-board-header">
                <Tabs variant="none" value={value} onChange={setValue}>
                    <Tabs.List className="list" ref={setRoofRef}>
                        <Tabs.Tab className="tab" value="reminders" ref={setControlRef("reminders")} onClick={() => setShowAnnouncements(false)}>Reminders</Tabs.Tab>
                        <Tabs.Tab className="tab" value="announcements" ref={setControlRef("announcements")} onClick={() => setShowAnnouncements(true)}>Announcements</Tabs.Tab>
                        <FloatingIndicator className="indicator" target={value ? controlsRef[value] : null} parent={roofRef} />
                    </Tabs.List>
                </Tabs>
                {/* <div className="notice-board-btn" onClick={() => setShowAnnouncements(true)}>Announcements</div>
                <div className="notice-board-btn" onClick={() => setShowAnnouncements(false)}>Reminders</div> */}
            </div>
            <div className="mobile-home-notice-board-content-container">
                {showAnnouncements && <div className="mobile-home-notice-board-container">
                    {/* <h2>Announcements</h2> */}
                    <div className="mobile-home-notice-board-content">
                        <AnnouncementsTabOptimistic householdId={user.householdId} active={true} />
                    </div>
                </div>}
                {!showAnnouncements && <div className="mobile-home-notice-board-container">
                    {/* <h2>Reminders</h2> */}
                    <div className="mobile-home-notice-board-content">
                        <p>No new reminders.</p>
                    </div>
                </div>}
            </div>

            <div className="mobile-home-notice-board-footer">
                <Button className="add-announcement-btn" radius="xl" variant="filled" size="compact-sm" color="rgb(5, 5, 73)" onClick={() => setShowCreateAnnouncement(true)}>+ Add announcement</Button>
                <Button color="rgb(5, 5, 73)" radius="xl" variant="transparent" size="compact-sm">View all →</Button>
            </div>

            {showCreateAnnouncement && <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />}
        </div>
    )
}