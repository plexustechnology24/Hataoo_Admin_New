import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const RenderStars = ({ rating = 0, size = 12 }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <FontAwesomeIcon key={s} icon={faStar} style={{ color: s <= rating ? '#7C7FFF' : '#d1d5db', fontSize: size }} />
        ))}
    </div>
);

export default RenderStars;
