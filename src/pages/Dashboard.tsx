import "../assets/styles/Dashboard.css"

export const Dashboard = () => {
    return <div className="dashboard">
        <div className="dashboard-titlebar">
            <h1>Household Name</h1>
            <div className="dashboard-titlebar-right">
                <input type="search" name="search" id="search" placeholder="Search" />
                <button>Bell</button>
                <button>Gear</button>
            </div>
        </div>
        <div className="dashboard-body">

        </div>

    </div>
}