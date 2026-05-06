"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface WebsiteActionMenuItem {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  external?: boolean;
}

interface WebsiteActionMenuProps {
  label?: string;
  items: WebsiteActionMenuItem[];
}

export function WebsiteActionMenu({ label = "Actions", items }: WebsiteActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="website-action-menu" ref={menuRef}>
      <button
        type="button"
        className="wizard-button-secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open ? (
        <ul className="website-action-menu-list" role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              {item.href ? (
                item.external ? (
                  <a
                    role="menuitem"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={item.disabled ? "website-action-menu-item-disabled" : undefined}
                    aria-disabled={item.disabled ? "true" : undefined}
                    onClick={(event) => {
                      if (item.disabled) {
                        event.preventDefault();
                        return;
                      }
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    role="menuitem"
                    href={item.href}
                    className={item.disabled ? "website-action-menu-item-disabled" : undefined}
                    aria-disabled={item.disabled ? "true" : undefined}
                    onClick={(event) => {
                      if (item.disabled) {
                        event.preventDefault();
                        return;
                      }
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect?.();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
