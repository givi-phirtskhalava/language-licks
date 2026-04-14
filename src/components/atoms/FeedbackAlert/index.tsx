import style from "./FeedbackAlert.module.css";

interface Props {
  theme: "correct" | "wrong";
  children: React.ReactNode;
}

export default function FeedbackAlert({ theme, children }: Props) {
  return (
    <div className={`${style.alert} ${style[theme]}`}>{children}</div>
  );
}
