import { referenceObjects, referenceObjectGroups } from "@/lib/garden/reference-objects";
import type { PlannerStructureKind } from "@/lib/garden/planner-plan";
import { ReferenceObjectArt } from "./reference-object-art";

export function ReferenceObjectCatalogue({ search, selected, onSelect }: {
  search: string; selected: PlannerStructureKind; onSelect: (kind: PlannerStructureKind) => void;
}) {
  const groups = [...referenceObjectGroups, { id: "ungrouped", displayName: "Other objects", objectCodes: referenceObjects.filter((object) => !object.group).map((object) => object.code) }];
  return <>{groups.map((group) => {
    const objects = referenceObjects.filter((object) => group.objectCodes.includes(object.code)
      && `${object.name} ${object.code} ${group.displayName}`.toLowerCase().includes(search.toLowerCase()));
    if (!objects.length) return null;
    return <details className="reference-object-group" key={group.id} open={Boolean(search)}>
      <summary><strong>{group.displayName}</strong><small>{objects.length} variants</small></summary>
      {objects.map((object) => {
        const kind: PlannerStructureKind = `reference-${object.code}`;
        return <button type="button" key={object.code} className={selected === kind ? "active" : ""} onClick={() => onSelect(kind)}>
          <span className="gv-structure-preset-icon"><ReferenceObjectArt kind={kind} /></span>
          <span><strong>{object.name} · {object.code}</strong><small>{object.shape.initialWidth} × {object.shape.initialHeight} cm</small></span>
        </button>;
      })}
    </details>;
  })}</>;
}
