import style from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={style.footer}>
      <div className={style.links}>
        <a href="/about" className={style.link}>About</a>
        <a href="#" className={style.link}>Terms</a>
        <a href="#" className={style.link}>Privacy</a>
        <a href="/contact" className={style.link}>Contact</a>
      </div>
    </footer>
  );
}
