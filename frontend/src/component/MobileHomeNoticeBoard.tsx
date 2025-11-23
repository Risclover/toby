import { useState } from "react"

export const MobileHomeNoticeBoard = () => {
    const [showAnnouncements, setShowAnnouncements] = useState(true);

    return (
        <div className="mobile-home-notice-board">
            <div className="mobile-home-notice-board-header">
                <div className="notice-board-btn" onClick={() => setShowAnnouncements(true)}>Announcements</div>
                <div className="notice-board-btn" onClick={() => setShowAnnouncements(false)}>Reminders</div>
            </div>
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
    )
}