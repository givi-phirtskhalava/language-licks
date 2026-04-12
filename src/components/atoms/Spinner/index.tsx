import style from "./Spinner.module.css";

interface IProps {
  color?: string;
}

export default function Spinner({ color = "white" }: IProps) {
  return (
    <div className={style.ldsRing}>
      <div
        style={{ borderColor: `${color} transparent transparent transparent` }}
      />
      <div
        style={{ borderColor: `${color} transparent transparent transparent` }}
      />
      <div
        style={{ borderColor: `${color} transparent transparent transparent` }}
      />
      <div
        style={{ borderColor: `${color} transparent transparent transparent` }}
      />
    </div>
  );
}
