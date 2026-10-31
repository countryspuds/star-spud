import { Outlet } from "react-router-dom";
import { Nav } from "./Nav";
import styles from "./layout.module.css";

export function Layout() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
