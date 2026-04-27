import style from "./AudioCreateNotice.module.css";

export default function AudioCreateNotice() {
  return (
    <div className={style.notice}>
      <p className={style.title}>Audio uploads</p>
      <p className={style.body}>
        Save the lesson first, then come back here to upload normal-speed and
        slow-speed mp3 recordings.
      </p>
    </div>
  );
}
