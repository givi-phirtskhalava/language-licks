import style from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={style.footer}>
      <div className={style.links}>
        <a href="#" className={style.link}>Terms</a>
        <a href="#" className={style.link}>Privacy</a>
        <a href="#" className={style.link}>Contact</a>
      </div>
    </footer>
  );
}
