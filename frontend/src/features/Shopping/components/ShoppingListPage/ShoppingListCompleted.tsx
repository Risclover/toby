import React, { useState, type SetStateAction } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import type { ShoppingItem } from '@/store/shoppingSlice';
import { ListItem } from './ListItem';
import { useAuthenticateQuery } from '@/store/authSlice';

type Props = {
    completed: ShoppingItem[];
    listId: number;
    showCompleted: boolean;
    setShowCompleted: React.Dispatch<SetStateAction<boolean>>;
}
export const ShoppingListCompleted = ({ completed, listId, showCompleted, setShowCompleted }: Props) => {
    const { data: user } = useAuthenticateQuery();

    return (
        <div className='household-tasklist-page-completed panel completed-panel'>
            <div
                className="household-tasklist-page-completed-title panel-header"
                onClick={() => setShowCompleted(prev => !prev)}
                title="Click to show"
            >
                <h2>{showCompleted ? "Hide completed" : `Completed (${completed.length})`}</h2>
                {showCompleted ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </div>
            {showCompleted && <div className="panel-body">
                {completed && completed.map((item) => (
                    <ListItem
                        key={item.id}                    // <-- add key
                        item={item}
                        listId={listId}
                    // taskId={item.id}
                    />
                ))}
            </div>}
        </div>
    )
}
