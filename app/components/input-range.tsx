import * as React from "react";
import styles from "./input-range.module.scss";

interface InputRangeProps {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  title?: string;
  value: number | string;
  className?: string;
  min: string;
  max: string;
  step: string;
  leftText?:string,
  rightText?:string
}

export function InputRange({
  onChange,
  title,
  value,
  className,
  min,
  max,
  step,
  rightText,
  leftText,
}: InputRangeProps) {
  return (
    <div className={styles["input-range"] + ` ${className ?? ""}`}>
      {title || value}
      <span style={{paddingLeft:"5px"}}>{leftText}</span>
      <input
        type="range"
        title={title}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      ></input>
      <span style={{paddingLeft:"5px"}}>{rightText}</span>
    </div>
  );
}
