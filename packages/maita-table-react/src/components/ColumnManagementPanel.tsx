'use client';

import * as React from 'react';
import type { ColumnConfig } from '@maita-table/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnManagementPanelProps<Row> {
  columns: ColumnConfig<Row>[];
  columnsOrder?: string[];
  columnsWidth?: Record<string, number>;
  columnsVisibility?: Record<string, boolean>;
  columnsPinned?: Record<string, 'left' | 'right'>;
  onColumnsOrderChange?: (order: string[]) => void;
  onColumnWidthChange?: (columnId: string, width: number) => void;
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  onColumnPinnedChange?: (
    columnId: string,
    pinned: 'left' | 'right' | undefined
  ) => void;
  onReset?: () => void;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SortableColumnItemProps<Row> {
  column: ColumnConfig<Row>;
  index: number;
  width?: number;
  visible?: boolean;
  pinned?: 'left' | 'right';
  onWidthChange?: (width: number) => void;
  onVisibilityChange?: (visible: boolean) => void;
  onPinnedChange?: (pinned: 'left' | 'right' | undefined) => void;
}

function SortableColumnItem<Row>({
  column,
  index,
  width,
  visible = true,
  pinned,
  onWidthChange,
  onVisibilityChange,
  onPinnedChange
}: SortableColumnItemProps<Row>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const minWidth = column.minWidth ?? 50;
  const maxWidth = column.maxWidth ?? 1000;
  const currentWidth = width ?? column.width ?? 150;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-card flex items-center gap-3 rounded-lg border p-3'
    >
      <div
        {...attributes}
        {...listeners}
        className='text-muted-foreground flex cursor-grab items-center active:cursor-grabbing'
        aria-label='拖拽排序'
      >
        <svg
          className='size-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 9l4-4 4 4m0 6l-4 4-4-4'
          />
        </svg>
      </div>

      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium'>{column.header}</div>
        <div className='text-muted-foreground truncate text-xs'>
          {column.id}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={visible}
            onChange={(e) => onVisibilityChange?.(e.target.checked)}
            className='border-input size-4 rounded'
          />
          <span className='text-xs'>显示</span>
        </label>

        <select
          value={pinned || ''}
          onChange={(e) =>
            onPinnedChange?.(
              e.target.value === 'left'
                ? 'left'
                : e.target.value === 'right'
                  ? 'right'
                  : undefined
            )
          }
          className='border-input bg-background h-8 rounded-md border px-2 text-xs'
        >
          <option value=''>不固定</option>
          <option value='left'>固定左侧</option>
          <option value='right'>固定右侧</option>
        </select>

        <div className='flex items-center gap-1'>
          <label className='text-muted-foreground text-xs'>宽度:</label>
          <input
            type='number'
            value={currentWidth}
            min={minWidth}
            max={maxWidth}
            onChange={(e) => {
              const newWidth = parseInt(e.target.value, 10);
              if (!isNaN(newWidth)) {
                onWidthChange?.(
                  Math.max(minWidth, Math.min(maxWidth, newWidth))
                );
              }
            }}
            className='border-input bg-background h-8 w-20 rounded-md border px-2 text-xs'
          />
        </div>
      </div>
    </div>
  );
}

export function ColumnManagementPanel<Row>({
  columns,
  columnsOrder,
  columnsWidth,
  columnsVisibility,
  columnsPinned,
  onColumnsOrderChange,
  onColumnWidthChange,
  onColumnVisibilityChange,
  onColumnPinnedChange,
  onReset,
  onClose,
  open = false,
  onOpenChange
}: ColumnManagementPanelProps<Row>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // 计算实际显示的列顺序
  const orderedColumns = React.useMemo(() => {
    const order = columnsOrder || columns.map((col) => col.id);
    return order
      .map((id) => columns.find((col) => col.id === id))
      .filter((col): col is ColumnConfig<Row> => !!col);
  }, [columns, columnsOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedColumns.findIndex((col) => col.id === active.id);
      const newIndex = orderedColumns.findIndex((col) => col.id === over.id);

      const newOrder = [...orderedColumns];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      onColumnsOrderChange?.(newOrder.map((col) => col.id));
    }
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-background flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border shadow-lg'>
        <div className='flex items-center justify-between border-b p-4'>
          <h2 className='text-lg font-semibold'>列管理</h2>
          <button
            onClick={() => onOpenChange?.(false)}
            className='text-muted-foreground hover:text-foreground p-1'
            aria-label='关闭'
          >
            <svg
              className='size-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedColumns.map((col) => col.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className='space-y-2'>
                {orderedColumns.map((column, index) => {
                  const columnId = column.id;
                  const width = columnsWidth?.[columnId];
                  const visible =
                    columnsVisibility?.[columnId] ?? column.visible !== false;
                  const pinned = columnsPinned?.[columnId];

                  return (
                    <SortableColumnItem
                      key={columnId}
                      column={column}
                      index={index}
                      width={width}
                      visible={visible}
                      pinned={pinned}
                      onWidthChange={(newWidth) =>
                        onColumnWidthChange?.(columnId, newWidth)
                      }
                      onVisibilityChange={(newVisible) =>
                        onColumnVisibilityChange?.(columnId, newVisible)
                      }
                      onPinnedChange={(newPinned) =>
                        onColumnPinnedChange?.(columnId, newPinned)
                      }
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className='flex items-center justify-end gap-2 border-t p-4'>
          <button
            onClick={onReset}
            className='border-input bg-background hover:bg-accent rounded-md border px-4 py-2 text-sm'
          >
            重置
          </button>
          <button
            onClick={() => onOpenChange?.(false)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm'
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
}
