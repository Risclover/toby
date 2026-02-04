import { Announcements } from "@/features/Announcements/components/Announcements";
import { CreateAnnouncement } from "@/features/Announcements/components/CreateAnnouncement";
import { useGetAnnouncementsQuery } from "@/store/announcementSlice";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useUnseenAnnouncements } from "@/features/Announcements/hooks/useUnseenAnnouncements";
import { Button, FloatingIndicator, Tabs, Badge } from "@mantine/core";
import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { DueTaskStat } from "@/components/DueTaskStats/DueTaskStat";

export const MobileHomeNoticeBoard = () => {
    const navigate = useNavigate();
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [roofRef, setRoofRef] = useState<HTMLDivElement | null>(null);
    const [value, setValue] = useState<string | null>("reminders");

    const { data: user } = useAuthenticateQuery();
    const { data: household } = useGetHouseholdQuery(user?.householdId);
    const { data } = useGetAnnouncementsQuery({ householdId: user?.householdId! });
    const { hasUnseen } = useUnseenAnnouncements(user?.householdId);

    const [controlsRef, setControlsRef] = useState<Record<string, HTMLButtonElement | null>>({});

    const setControlRef = (val: string) => (node: HTMLButtonElement) => {
        controlsRef[val] = node;
        setControlsRef(controlsRef);
    }

    return (
        <div className="mobile-home-section">
            <div className="mobile-home-notice-board-container">
                <div className="mobile-home-notice-board">
                    <div className="mobile-home-notice-board-header">
                        <Tabs variant="none" value={value} onChange={setValue}>
                            <Tabs.List className="list" ref={setRoofRef}>
                                <Tabs.Tab className="tab" value="reminders" ref={setControlRef("reminders")} onClick={() => setShowAnnouncements(false)}>
                                    Reminders
                                </Tabs.Tab>
                                <Tabs.Tab className="tab" value="announcements" ref={setControlRef("announcements")} onClick={() => setShowAnnouncements(true)}>
                                    <span style={{ height: "10px", display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                                        Announcements
                                        {hasUnseen && (
                                            <span className="notification-dot" aria-label="New announcements" />
                                        )}
                                    </span>
                                </Tabs.Tab>
                                <FloatingIndicator className="indicator" target={value ? controlsRef[value] : null} parent={roofRef} />
                            </Tabs.List>
                        </Tabs>
                    </div>
                    <div className="mobile-home-notice-board-content-container">
                        {showAnnouncements && <div className="mobile-home-notice-board-section">
                            <div className="mobile-home-notice-board-content">
                                <Announcements householdId={user.householdId} activeTab={value} maxDisplayed={4} fullPage={false} />
                            </div>
                        </div>}
                        {!showAnnouncements && <div className="mobile-home-notice-board-section">
                            <div className="mobile-home-notice-board-content">
                                <p>No new reminders.</p>
                            </div>
                        </div>}
                    </div>

                    <div className="mobile-home-notice-board-footer">
                        <Button className="add-announcement-btn" radius="xl" variant="filled" size="compact-sm" color="rgb(5, 5, 73)" onClick={() => setShowCreateAnnouncement(true)}>+ Add announcement</Button>
                        {data?.items && data?.items.length > 0 && <Button color="rgb(5, 5, 73)" radius="xl" variant="transparent" size="compact-sm" onClick={() => navigate("/announcements")}>View all →</Button>}
                    </div>

                    {showCreateAnnouncement && <CreateAnnouncement opened={showCreateAnnouncement} close={() => setShowCreateAnnouncement(false)} />}
                </div>
            </div>
        </div>
    )
}
