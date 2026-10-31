import { use } from "react";
import { getPhotoOfMonth } from "../../data";
import { monthNameEn } from "../../lib/time";
import { Card } from "../ui/Card";
import { ExampleCaption, Label } from "../ui/Label";
import styles from "./bento.module.css";

export function PhotoOfMonth({ className }: { className?: string }) {
  const photo = use(getPhotoOfMonth());

  return (
    <Card className={[styles.photo, className].filter(Boolean).join(" ")}>
      <img src={photo.src} alt={`${photo.title} — ${photo.place}`} className={styles.photoImg} />
      <div className={styles.photoCaption}>
        <Label className={styles.onPhoto}>{monthNameEn(photo.date)} · 이달의 하늘</Label>
        <h2 className={styles.cardTitle}>{photo.title}</h2>
        <p className={styles.photoMeta}>
          {photo.author} · {photo.date.replaceAll("-", ".")} · Bortle {photo.bortle}
        </p>
      </div>
      <span className={styles.likeChip}>
        <span className={styles.heart} aria-hidden="true">
          ♥
        </span>
        <span className="tabular">{photo.likes}</span>
        <span className="sr-only">명이 좋아해요</span>
      </span>
      <ExampleCaption className={styles.photoExample} />
    </Card>
  );
}
