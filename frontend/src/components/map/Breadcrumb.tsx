import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Label } from "../ui/Label";
import styles from "./map.module.css";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className={styles.section}>
      <Label>위치</Label>
      <nav aria-label="현재 위치" className={styles.crumbs}>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${i}-${c.label}`}>
              {i > 0 && (
                <span className={styles.crumbSep} aria-hidden="true">
                  ›
                </span>
              )}
              {c.to && !last ? (
                <Link to={c.to} className={styles.crumbLink}>
                  {c.label}
                </Link>
              ) : (
                <span className={last ? styles.crumbCurrent : undefined}>{c.label}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
