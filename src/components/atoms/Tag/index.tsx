import { ReactNode } from "react";
import style from "./Tag.module.css";

interface Props {
  children: ReactNode;
}

export default function Tag({ children }: Props) {
  return <span className={style.tag}>{children}</span>;
}
