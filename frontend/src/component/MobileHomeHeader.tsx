import { TobyIcon } from '@/assets/icons/TobyIcon';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Link } from 'react-router-dom';
import { useAuthenticateQuery } from '@/store/authSlice';

export const MobileHeader = () => {
    const { data: user } = useAuthenticateQuery();

    console.log('user:', user)
    return (
        <div className="mobile-header-container">
            <div className="mobile-header-left">
                {/* TASK: Animated hamburger menu icon */}
                <MenuRoundedIcon />
                <div className="brand">
                    <TobyIcon />
                </div>
            </div>
            <div className="mobile-header-right">
                <div className="mobile-header-icon-btns">
                    {/* Search button */}
                    <SearchRoundedIcon />

                    {/* Daily check-in button */}
                    <HowToRegRoundedIcon />
                </div>

                {/* Separator */}
                <div className="mobile-header-separator" />

                {/* User avatar */}
                <div className="mobile-header-user"><img src={user?.profileImg} /></div>
                {user?.errors && user?.errors[0] === "Unauthorized" ? <Link to="/login">Login</Link> : <Link to="/logout">Logout</Link>}
            </div>
        </div>
    )
}