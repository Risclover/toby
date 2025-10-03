import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetMyMoodQuery, useSetMyMoodMutation } from "@/store/moodSlice";
import React, { useMemo, useState } from "react";

// keep your single source of truth
const MOODS = [
    "happy", "content", "neutral", "tired", "stressed", "sick", "busy", "bored",
    "accomplished", "proud", "excited", "productive", "overwhelmed", "motivated",
    "cozy", "inspired",
] as const;
type MoodKey = typeof MOODS[number];

export const SetMood = () => {
    const [setMyMood, { isLoading }] = useSetMyMoodMutation();
    const { data: myMood } = useGetMyMoodQuery();
    const { data: user } = useAuthenticateQuery();

    // Start from current mood (or empty string for placeholder)
    const initial = (myMood?.mood ?? "") as "" | MoodKey;
    const [chosenMood, setChosenMood] = useState<"" | MoodKey>(initial);

    const options = useMemo(
        () => MOODS.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) })),
        []
    );

    const handleMood = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as "" | MoodKey;
        setChosenMood(value);
        if (value === "") return;              // user picked placeholder, do nothing
        await setMyMood({ mood: value });      // send the actual value; no toLowerCase needed
    };

    return (
        <div>
            <h2>Set Mood:</h2>
            <select value={chosenMood} onChange={handleMood} disabled={isLoading}>
                {/* placeholder must have empty value in a controlled select */}
                <option value="">Select a mood…</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            Mood: {myMood?.mood}
        </div>
    );
};
