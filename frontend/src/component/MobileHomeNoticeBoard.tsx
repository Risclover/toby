import { FloatingIndicator, Tabs } from "@mantine/core";
import { useState } from "react"

export const MobileHomeNoticeBoard = () => {
    const [showAnnouncements, setShowAnnouncements] = useState(true);
    const [roofRef, setRoofRef] = useState<HTMLDivElement | null>(null);
    const [value, setValue] = useState<string>("announcements");


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
                        <p>No new announcements.</p>
                    </div>
                </div>}
                {!showAnnouncements && <div className="mobile-home-notice-board-container">
                    {/* <h2>Reminders</h2> */}
                    <div className="mobile-home-notice-board-content">
                        <p>No new reminders.</p>
                    </div>
                </div>}
            </div>
        </div>
    )
}