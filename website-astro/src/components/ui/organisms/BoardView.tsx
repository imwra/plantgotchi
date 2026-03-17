import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BoardCard from '../molecules/BoardCard';
import BoardColumn from '../molecules/BoardColumn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IssueData {
  id: string;
  title: string;
  status: string;
  assignee_ids: string | null;
  fieldValues: { field_id: string; field_name: string; value: string }[];
}

interface FieldDef {
  id: string;
  name: string;
  field_type: string;
  options: string;
}

export interface BoardViewProps {
  projectId: string;
  issues: IssueData[];
  fields: FieldDef[];
  boardField?: string; // field ID to group by, or 'status' (default)
  onStatusChange?: (issueId: string, newStatus: string) => void;
  onReorder?: (issueIds: string[]) => void;
  onIssueClick?: (issueId: string) => void;
  emptyLabel?: string;
}

// ---------------------------------------------------------------------------
// Status column config
// ---------------------------------------------------------------------------

const STATUS_COLUMNS = [
  { value: 'todo', label: 'Todo', color: '#9ca3af' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'done', label: 'Done', color: '#22c55e' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
];

// ---------------------------------------------------------------------------
// SortableBoardCard wrapper
// ---------------------------------------------------------------------------

function SortableBoardCard({
  issue,
  onClick,
}: {
  issue: IssueData;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // Extract field chip and assignee
  const fieldChip = issue.fieldValues.length > 0
    ? { label: issue.fieldValues[0].value, color: '#8b5cf6' }
    : undefined;

  const assigneeAvatar = issue.assignee_ids
    ? { name: issue.assignee_ids.split(',')[0] }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardCard
        id={issue.id}
        title={issue.title}
        fieldChip={fieldChip}
        assigneeAvatar={assigneeAvatar}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BoardView
// ---------------------------------------------------------------------------

export default function BoardView({
  projectId,
  issues,
  fields,
  boardField = 'status',
  onStatusChange,
  onReorder,
  onIssueClick,
  emptyLabel = 'No issues',
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localIssues, setLocalIssues] = useState(issues);

  // Keep localIssues in sync with prop changes
  useMemo(() => {
    setLocalIssues(issues);
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Determine columns based on boardField
  const columns = useMemo(() => {
    if (boardField === 'status') {
      return STATUS_COLUMNS;
    }
    // Custom field columns
    const field = fields.find(f => f.id === boardField);
    if (!field) return STATUS_COLUMNS;
    try {
      const opts = JSON.parse(field.options);
      return Array.isArray(opts)
        ? opts.map((opt: string, i: number) => ({
            value: opt,
            label: opt,
            color: ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'][i % 6],
          }))
        : STATUS_COLUMNS;
    } catch {
      return STATUS_COLUMNS;
    }
  }, [boardField, fields]);

  // Group issues into columns
  const columnIssues = useMemo(() => {
    const grouped: Record<string, IssueData[]> = {};
    for (const col of columns) {
      grouped[col.value] = [];
    }
    for (const issue of localIssues) {
      let value: string;
      if (boardField === 'status') {
        value = issue.status;
      } else {
        const fv = issue.fieldValues.find(f => f.field_id === boardField);
        value = fv?.value || '';
      }
      if (grouped[value]) {
        grouped[value].push(issue);
      } else if (columns.length > 0) {
        // Put in first column if value doesn't match
        grouped[columns[0].value]?.push(issue);
      }
    }
    return grouped;
  }, [localIssues, columns, boardField]);

  const activeIssue = activeId ? localIssues.find(i => i.id === activeId) : null;

  // Find which column an issue belongs to
  const findColumn = (issueId: string): string | null => {
    for (const [colValue, colIssues] of Object.entries(columnIssues)) {
      if (colIssues.some(i => i.id === issueId)) {
        return colValue;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    // over could be a column id or another card id
    let overCol = columns.find(c => c.value === over.id)?.value || findColumn(over.id as string);

    if (!activeCol || !overCol || activeCol === overCol) return;

    // Move issue to new column
    setLocalIssues(prev => {
      const issue = prev.find(i => i.id === active.id);
      if (!issue) return prev;

      const updated = { ...issue };
      if (boardField === 'status') {
        updated.status = overCol!;
      }
      return prev.map(i => i.id === issue.id ? updated : i);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = columns.find(c => c.value === over.id)?.value || findColumn(over.id as string);

    if (!activeCol || !overCol) return;

    // If the issue moved columns, fire status change
    const originalIssue = issues.find(i => i.id === active.id);
    if (originalIssue) {
      const originalCol = boardField === 'status'
        ? originalIssue.status
        : originalIssue.fieldValues.find(f => f.field_id === boardField)?.value || '';

      if (originalCol !== overCol) {
        onStatusChange?.(active.id as string, overCol);
      }
    }

    // Fire reorder with the new ordering
    const allIds = localIssues.map(i => i.id);
    onReorder?.(allIds);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => {
          const colIssues = columnIssues[col.value] || [];
          return (
            <SortableContext
              key={col.value}
              items={colIssues.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <BoardColumn
                id={col.value}
                label={col.label}
                count={colIssues.length}
                color={col.color}
                emptyLabel={emptyLabel}
              >
                {colIssues.map(issue => (
                  <SortableBoardCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => onIssueClick?.(issue.id)}
                  />
                ))}
              </BoardColumn>
            </SortableContext>
          );
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeIssue ? (
          <BoardCard
            id={activeIssue.id}
            title={activeIssue.title}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
