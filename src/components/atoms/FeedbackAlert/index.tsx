import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import style from "./FeedbackAlert.module.css";

interface Props {
  theme: "correct" | "wrong";
  children: React.ReactNode;
}

export default function FeedbackAlert({ theme, children }: Props) {
  return (
    <div className={`${style.alert} ${style[theme]}`}>
      {theme === "correct" && (
        <span className={style.checkCircle}>
          <FontAwesomeIcon icon={faCheck} />
        </span>
      )}
      <span className={style.text}>{children}</span>
    </div>
  );
}
