"use client";

import { useEffect, useRef, useState } from "react";

const EDIT_KEY_SESSION = "blenheim-garden-edit-key";

export function EditKeyDialogBridge() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editKey, setEditKey] = useState("");

  useEffect(() => {
    function openSettings(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const settingsButton = target?.closest(".gv-settings");
      if (!settingsButton) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setEditKey(sessionStorage.getItem(EDIT_KEY_SESSION) ?? "");
      dialogRef.current?.showModal();
    }

    document.addEventListener("click", openSettings, true);
    return () => document.removeEventListener("click", openSettings, true);
  }, []);

  function saveKey() {
    const value = editKey.trim();
    if (value) sessionStorage.setItem(EDIT_KEY_SESSION, value);
    else sessionStorage.removeItem(EDIT_KEY_SESSION);
    dialogRef.current?.close();
  }

  function clearKey() {
    sessionStorage.removeItem(EDIT_KEY_SESSION);
    setEditKey("");
    dialogRef.current?.close();
  }

  return (
    <dialog ref={dialogRef} className="garden-key-dialog" onCancel={() => dialogRef.current?.close()}>
      <form method="dialog" className="garden-key-card" onSubmit={(event) => { event.preventDefault(); saveKey(); }}>
        <div className="garden-key-head">
          <div>
            <strong>Garden Settings</strong>
            <span>Cloud save access</span>
          </div>
          <button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}>×</button>
        </div>

        <label className="garden-key-field">
          <span>Garden edit key</span>
          <input
            type="password"
            value={editKey}
            onChange={(event) => setEditKey(event.target.value)}
            placeholder="Enter the same key saved in Cloudflare"
            autoComplete="off"
            autoFocus
          />
        </label>

        <p>The key stays only in this browser tab/session. It is not written to GitHub or displayed on the garden.</p>

        <div className="garden-key-actions">
          <button type="button" className="garden-key-clear" onClick={clearKey}>Clear key</button>
          <button type="submit" className="garden-key-save">Save key</button>
        </div>
      </form>

      <style jsx>{`
        .garden-key-dialog {
          border: 0;
          padding: 0;
          width: min(430px, calc(100vw - 32px));
          border-radius: 8px;
          box-shadow: 0 18px 55px rgba(0, 0, 0, .28);
          color: #263630;
        }
        .garden-key-dialog::backdrop { background: rgba(24, 38, 33, .44); }
        .garden-key-card { margin: 0; padding: 0; background: #fff; }
        .garden-key-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 17px;
          border-bottom: 1px solid #d9e1dd;
        }
        .garden-key-head div { display: grid; gap: 2px; }
        .garden-key-head strong { font-size: 15px; }
        .garden-key-head span { color: #728079; font-size: 11px; }
        .garden-key-head button {
          border: 0;
          background: transparent;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          color: #65736d;
        }
        .garden-key-field {
          display: grid;
          gap: 6px;
          padding: 17px 17px 8px;
          font-size: 12px;
          font-weight: 700;
        }
        .garden-key-field input {
          height: 38px;
          border: 1px solid #b9c6c0;
          border-radius: 4px;
          padding: 0 10px;
          font: inherit;
          font-weight: 500;
          outline: none;
        }
        .garden-key-field input:focus {
          border-color: #19a97b;
          box-shadow: 0 0 0 2px rgba(25, 169, 123, .13);
        }
        .garden-key-card p {
          margin: 0;
          padding: 7px 17px 16px;
          color: #68756f;
          font-size: 11px;
          line-height: 1.45;
        }
        .garden-key-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 17px 16px;
          border-top: 1px solid #edf1ef;
        }
        .garden-key-actions button {
          min-height: 34px;
          border-radius: 4px;
          padding: 0 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .garden-key-clear { border: 1px solid #cdd6d2; background: #fff; color: #5c6963; }
        .garden-key-save { border: 1px solid #138a65; background: #19a97b; color: white; }
      `}</style>
    </dialog>
  );
}
