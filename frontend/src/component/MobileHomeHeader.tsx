import { TobyIcon } from '@/assets/icons/TobyIcon';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

export const MobileHeader = () => {
    return (
        <div className="mobile-header-container">
            <div className="mobile-header-left">
                {/* TODO: Animated hamburger menu icon */}
                <MenuRoundedIcon />
                <div className="brand">
                    <TobyIcon />
                    <div className="title">Toby</div>
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
                <div className="mobile-header-user"></div>

            </div>
        </div>
    )
}