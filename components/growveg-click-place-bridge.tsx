"use client";

import { useEffect } from "react";

type ArmedPlant = {
  button: HTMLButtonElement;
  dataTransfer: DataTransfer;
  icon: string;
  name: string;
  spacingCm: number;
};

type DrawGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  dragged: boolean;
};

const CANVAS_WIDTH_CM = 900;
const CANVAS_HEIGHT_CM = 1080;
const DRAW_THRESHOLD_PX = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function plantsToolActive() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
    .some((button) => button.classList.contains("active") && button.querySelector("small")?.textContent?.trim() === "Plants");
}

function toolButton(label: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".gv-rail button"))
    .find((button) => button.querySelector("small")?.textContent?.trim() === label) ?? null;
}

function parseSpacing(button: HTMLButtonElement) {
  const text = button.querySelector("small")?.textContent ?? "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*cm/i);
  return match ? Math.max(2, Number(match[1])) : 30;
}

function activePlacementMode() {
  return document.querySelector<HTMLButtonElement>(".gv-v4-modebar button.active")?.textContent?.trim() ?? "Block";
}

function bedDimensionsCm(bed: HTMLElement) {
  const widthPercent = Number.parseFloat(bed.style.width) || 100;
  const heightPercent = Number.parseFloat(bed.style.height) || 100;
  return {
    width: CANVAS_WIDTH_CM * widthPercent / 100,
    height: CANVAS_HEIGHT_CM * heightPercent / 100,
  };
}

function createGhost(armed: ArmedPlant) {
  const ghost = document.createElement("div");
  ghost.className = "gv-click-place-ghost";
  ghost.setAttribute("aria-hidden", "true");

  const icons = document.createElement("span");
  icons.className = "gv-click-place-ghost-icons";

  const label = document.createElement("span");
  label.className = "gv-click-place-ghost-label";
  label.textContent = `${armed.icon} ${armed.name} · ${armed.spacingCm} cm centres`;

  ghost.append(icons, label);
  return ghost;
}

function createRowGhost(armed: ArmedPlant) {
  const ghost = document.createElement("div");
  ghost.className = "gv-row-draw-ghost";
  ghost.setAttribute("aria-hidden", "true");

  const line = document.createElement("span");
  line.className = "gv-row-draw-line";

  const dots = document.createElement("span");
  dots.className = "gv-row-draw-dots";

  const label = document.createElement("span");
  label.className = "gv-row-draw-label";
  label.textContent = `${armed.icon} drag to draw row`;

  line.append(dots);
  ghost.append(line, label);
  return ghost;
}

function fillGhostIcons(ghost: HTMLElement, armed: ArmedPlant, mode: string) {
  const icons = ghost.querySelector<HTMLElement>(".gv-click-place-ghost-icons");
  if (!icons) return;

  const wanted = mode === "Single" ? 1 : mode === "Rows" ? 6 : mode === "Natural" ? 7 : 9;
  if (icons.childElementCount === wanted && ghost.dataset.mode === mode) return;

  icons.replaceChildren();
  ghost.dataset.mode = mode;
  for (let index = 0; index < wanted; index += 1) {
    const icon = document.createElement("i");
    icon.textContent = armed.icon;
    icons.append(icon);
  }
}

function dispatchSyntheticRow(startX: number, startY: number, endX: number, endY: number) {
  const rowsButton = toolButton("Rows");
  const canvas = document.querySelector<HTMLDivElement>(".garden-canvas");
  if (!rowsButton || !canvas) return false;

  rowsButton.click();

  window.requestAnimationFrame(() => {
    const originalCapture = canvas.setPointerCapture?.bind(canvas);
    try {
      Object.defineProperty(canvas, "setPointerCapture", {
        configurable: true,
        value: () => undefined,
      });
    } catch {
      // Synthetic pointer capture can fail in some browsers; the planner only needs the draft state here.
    }

    canvas.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: 9876,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: startX,
      clientY: startY,
    }));

    if (originalCapture) {
      try {
        Object.defineProperty(canvas, "setPointerCapture", {
          configurable: true,
          value: originalCapture,
        });
      } catch {
        // Ignore restoration failure; browsers provide the prototype method on the next real interaction.
      }
    }

    window.requestAnimationFrame(() => {
      canvas.dispatchEvent(new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        pointerId: 9876,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientX: endX,
        clientY: endY,
      }));

      window.requestAnimationFrame(() => {
        canvas.dispatchEvent(new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          pointerId: 9876,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
          buttons: 0,
          clientX: endX,
          clientY: endY,
        }));
      });
    });
  });

  return true;
}

export function GrowVegClickPlaceBridge() {
  useEffect(() => {
    let armed: ArmedPlant | null = null;
    let ghost: HTMLDivElement | null = null;
    let rowGhost: HTMLDivElement | null = null;
    let targetBed: HTMLElement | null = null;
    let drawGesture: DrawGesture | null = null;
    let syntheticRowInProgress = false;

    const clearTarget = () => {
      targetBed?.classList.remove("gv-click-place-target");
      targetBed = null;
      ghost?.remove();
      ghost = null;
      rowGhost?.remove();
      rowGhost = null;
      document.documentElement.classList.remove("gv-row-draw-active");
    };

    const disarm = (dispatchDragEnd = true) => {
      clearTarget();
      drawGesture = null;
      document.documentElement.classList.remove("gv-click-place-armed");
      if (armed) {
        armed.button.classList.remove("gv-pickup-armed");
        if (dispatchDragEnd) {
          armed.button.dispatchEvent(new DragEvent("dragend", {
            bubbles: true,
            cancelable: true,
            dataTransfer: armed.dataTransfer,
          }));
        }
      }
      armed = null;
    };

    const arm = (button: HTMLButtonElement) => {
      if (!plantsToolActive() || typeof DataTransfer === "undefined") return;

      disarm();
      const dataTransfer = new DataTransfer();
      const icon = button.querySelector<HTMLElement>(".gv-plant-icon")?.textContent?.trim() || "🌱";
      const name = button.querySelector("strong")?.textContent?.trim() || "Plant";
      const spacingCm = parseSpacing(button);

      button.dispatchEvent(new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      }));

      armed = { button, dataTransfer, icon, name, spacingCm };
      document.documentElement.classList.add("gv-click-place-armed");
      button.classList.add("gv-pickup-armed");
    };

    const updateGhost = (clientX: number, clientY: number) => {
      if (!armed || drawGesture?.dragged) return;

      const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const bed = element?.closest<HTMLElement>(".plan-bed.gv-v4-bed") ?? null;
      if (!bed) {
        clearTarget();
        return;
      }

      if (targetBed !== bed) {
        clearTarget();
        targetBed = bed;
        targetBed.classList.add("gv-click-place-target");
        ghost = createGhost(armed);
        bed.append(ghost);
      }

      if (!ghost) return;

      const rect = bed.getBoundingClientRect();
      const bedCm = bedDimensionsCm(bed);
      const desiredWidthCm = Math.min(bedCm.width, Math.max(120, armed.spacingCm * 3));
      const desiredHeightCm = Math.min(bedCm.height, Math.max(120, armed.spacingCm * 3));
      const widthPct = clamp(desiredWidthCm / Math.max(1, bedCm.width) * 100, 12, 100);
      const heightPct = clamp(desiredHeightCm / Math.max(1, bedCm.height) * 100, 12, 100);
      const centerX = clamp((clientX - rect.left) / Math.max(1, rect.width) * 100, 0, 100);
      const centerY = clamp((clientY - rect.top) / Math.max(1, rect.height) * 100, 0, 100);
      const left = clamp(centerX - widthPct / 2, 0, 100 - widthPct);
      const top = clamp(centerY - heightPct / 2, 0, 100 - heightPct);
      const mode = activePlacementMode();

      ghost.style.left = `${left}%`;
      ghost.style.top = `${top}%`;
      ghost.style.width = `${widthPct}%`;
      ghost.style.height = `${heightPct}%`;
      fillGhostIcons(ghost, armed, mode);

      const label = ghost.querySelector<HTMLElement>(".gv-click-place-ghost-label");
      const variety = document.querySelector<HTMLElement>(".gv-ready-strip strong")?.textContent?.trim();
      if (label) label.textContent = `${armed.icon} ${variety || armed.name} · ${armed.spacingCm} cm · ${mode}`;
    };

    const updateRowGhost = (clientX: number, clientY: number) => {
      if (!armed || !drawGesture) return;
      const canvas = document.querySelector<HTMLElement>(".garden-canvas");
      if (!canvas) return;

      if (!rowGhost) {
        rowGhost = createRowGhost(armed);
        canvas.append(rowGhost);
      }

      const canvasRect = canvas.getBoundingClientRect();
      const logicalX = CANVAS_WIDTH_CM / Math.max(1, canvasRect.width);
      const logicalY = CANVAS_HEIGHT_CM / Math.max(1, canvasRect.height);
      const startX = (drawGesture.startX - canvasRect.left) * logicalX;
      const startY = (drawGesture.startY - canvasRect.top) * logicalY;
      const endX = (clientX - canvasRect.left) * logicalX;
      const endY = (clientY - canvasRect.top) * logicalY;
      const dx = endX - startX;
      const dy = endY - startY;
      const lengthCm = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const count = Math.max(1, Math.floor(lengthCm / Math.max(2, armed.spacingCm)) + 1);

      rowGhost.style.left = `${startX}px`;
      rowGhost.style.top = `${startY}px`;
      rowGhost.style.width = `${lengthCm}px`;
      rowGhost.style.transform = `rotate(${angle}deg)`;

      const dots = rowGhost.querySelector<HTMLElement>(".gv-row-draw-dots");
      if (dots) {
        const visible = Math.min(count, 28);
        if (dots.childElementCount !== visible) {
          dots.replaceChildren();
          for (let index = 0; index < visible; index += 1) {
            const dot = document.createElement("i");
            dot.textContent = armed.icon;
            dots.append(dot);
          }
        }
      }

      const label = rowGhost.querySelector<HTMLElement>(".gv-row-draw-label");
      if (label) label.textContent = `${(lengthCm / 100).toFixed(1)} m · ≈ ${count} plants · release to draw row`;
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const plantButton = target?.closest<HTMLButtonElement>(".gv-plant-list > button[draggable=\"true\"]") ?? null;
      if (plantButton) {
        window.requestAnimationFrame(() => arm(plantButton));
        return;
      }

      const railButton = target?.closest<HTMLButtonElement>(".gv-rail button") ?? null;
      if (railButton && railButton.querySelector("small")?.textContent?.trim() !== "Plants") disarm();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!armed || syntheticRowInProgress) return;

      if (drawGesture && event.pointerId === drawGesture.pointerId) {
        drawGesture.currentX = event.clientX;
        drawGesture.currentY = event.clientY;
        const distance = Math.hypot(event.clientX - drawGesture.startX, event.clientY - drawGesture.startY);
        if (distance >= DRAW_THRESHOLD_PX) {
          drawGesture.dragged = true;
          ghost?.remove();
          ghost = null;
          document.documentElement.classList.add("gv-row-draw-active");
          updateRowGhost(event.clientX, event.clientY);
          return;
        }
      }

      updateGhost(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!armed || syntheticRowInProgress || event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      const bed = target?.closest<HTMLElement>(".plan-bed.gv-v4-bed") ?? null;
      if (!bed) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      updateGhost(event.clientX, event.clientY);

      drawGesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        dragged: false,
      };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!armed || syntheticRowInProgress || !drawGesture || event.pointerId !== drawGesture.pointerId) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const gesture = drawGesture;
      drawGesture = null;

      if (gesture.dragged) {
        const startX = gesture.startX;
        const startY = gesture.startY;
        const endX = event.clientX;
        const endY = event.clientY;
        clearTarget();
        syntheticRowInProgress = true;

        const started = dispatchSyntheticRow(startX, startY, endX, endY);
        window.setTimeout(() => {
          syntheticRowInProgress = false;
          disarm();
        }, started ? 180 : 0);
        return;
      }

      const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const bed = target?.closest<HTMLElement>(".plan-bed.gv-v4-bed") ?? targetBed;
      if (!bed) {
        clearTarget();
        return;
      }

      bed.dispatchEvent(new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        clientX: event.clientX,
        clientY: event.clientY,
        dataTransfer: armed.dataTransfer,
      }));

      window.requestAnimationFrame(() => disarm());
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && armed) disarm();
    };

    const onContextMenu = () => {
      if (armed) disarm();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onContextMenu);
      disarm(false);
    };
  }, []);

  return null;
}
