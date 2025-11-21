import { Moods } from "@/assets";
import "../styles/ChooseMood.css";

export const ChooseMood = () => {
    return (
        <div className="choose-mood-grid">{Moods.map(mood => <div className="choose-mood-item"><img src={mood.src} alt={mood.name} />{mood.name}</div>)}</div>
    )
}