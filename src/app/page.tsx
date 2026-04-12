import Lessons from "@/components/organisms/Lessons";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <Lessons />
    </main>
  );
}
