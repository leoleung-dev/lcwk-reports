"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./TopBar.module.css";

const reportMenus = [
  {
    key: "sales",
    label: "營業額 · Sales",
    prefixes: ["/sales"],
    links: (year) => [
      { label: "Open report", href: "/sales" },
      { label: `View annual (${year})`, href: `/sales/summary/${year}` },
      { label: "View overall", href: "/sales/summary/overall" },
    ],
  },
  {
    key: "commission",
    label: "佣金登記 · Commission",
    prefixes: ["/commission"],
    links: (year) => [
      { label: "Open report", href: "/commission" },
      { label: `View annual (${year})`, href: `/commission/summary/${year}` },
      { label: "View overall", href: "/commission/summary/overall" },
    ],
  },
  {
    key: "cerement",
    label: "壽衣紀錄 · Cerement",
    prefixes: ["/cerement"],
    links: (year) => [
      { label: "Open report", href: "/cerement" },
      { label: `View annual (${year})`, href: `/cerement/summary/${year}` },
      { label: "View overall", href: "/cerement/summary/overall" },
    ],
  },
  {
    key: "hkfh-sales",
    label: "香港分店營業額 · HKFH Sales",
    prefixes: ["/hkfh-sales"],
    links: (year) => [
      { label: "Open report", href: "/hkfh-sales" },
      { label: `View annual (${year})`, href: `/hkfh-sales/summary/${year}` },
      { label: "View overall", href: "/hkfh-sales/summary/overall" },
    ],
  },
];

const adminMenu = {
  key: "admin",
  label: "Admin",
  prefixes: ["/admin"],
  links: [
    { label: "Admin home", href: "/admin" },
    { label: "Services", href: "/admin/services" },
    { label: "Handlers", href: "/admin/handlers" },
    { label: "Access", href: "/admin/access" },
  ],
};

function pathMatches(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function menuIsActive(pathname, prefixes) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function TopBar() {
  const { status } = useSession();
  const pathname = usePathname();
  const navRef = useRef(null);
  const year = String(new Date().getFullYear());

  function handleMenuToggle(event) {
    const currentMenu = event.currentTarget;
    if (!currentMenu.open) {
      return;
    }
    const container = navRef.current;
    if (!container) {
      return;
    }
    container.querySelectorAll("details[open]").forEach((menu) => {
      if (menu !== currentMenu) {
        menu.removeAttribute("open");
      }
    });
  }

  useEffect(() => {
    const container = navRef.current;
    if (!container) {
      return;
    }
    container.querySelectorAll("details[open]").forEach((menu) => {
      menu.removeAttribute("open");
    });
  }, [pathname]);

  if (status !== "authenticated" || pathname === "/login") {
    return null;
  }

  return (
    <header className={styles.shell}>
      <div className={styles.bar}>
        <Link
          href="/"
          className={`${styles.brand} ${
            pathMatches(pathname, "/") ? styles.brandActive : ""
          }`}
        >
          <span className={styles.brandMark}>LCWK</span>
          <span className={styles.brandText}>Reports</span>
        </Link>

        <nav
          ref={navRef}
          className={styles.nav}
          aria-label="Global report navigation"
        >
          {reportMenus.map((menu) => {
            const links = menu.links(year);
            const isActive = menuIsActive(pathname, menu.prefixes);
            return (
              <details
                key={menu.key}
                className={styles.menu}
                onToggle={handleMenuToggle}
              >
                <summary
                  className={`${styles.menuSummary} ${
                    isActive ? styles.menuSummaryActive : ""
                  }`}
                >
                  {menu.label}
                  <span className={styles.caret} aria-hidden="true">
                    ▾
                  </span>
                </summary>
                <div className={styles.menuList}>
                  {links.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.menuLink} ${
                        pathMatches(pathname, item.href) ? styles.menuLinkActive : ""
                      }`}
                      onClick={(event) => {
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            );
          })}

          <details
            className={`${styles.menu} ${styles.menuRight}`}
            onToggle={handleMenuToggle}
          >
            <summary
              className={`${styles.menuSummary} ${
                menuIsActive(pathname, adminMenu.prefixes)
                  ? styles.menuSummaryActive
                  : ""
              }`}
            >
              {adminMenu.label}
              <span className={styles.caret} aria-hidden="true">
                ▾
              </span>
            </summary>
            <div className={styles.menuList}>
              {adminMenu.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.menuLink} ${
                    pathMatches(pathname, item.href) ? styles.menuLinkActive : ""
                  }`}
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <button
          className={styles.signOut}
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
