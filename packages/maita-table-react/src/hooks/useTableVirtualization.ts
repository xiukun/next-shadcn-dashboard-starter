'use client';

import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { Row } from '@tanstack/react-table';
import type { DataGridStore } from '../store';

export interface UseTableVirtualizationOptions<Row> {
  store: DataGridStore<Row>;
  /**
   * 估算行高（默认 36）
   */
  estimateRowHeight?: number;
  /**
   * 虚拟化 overscan（默认 12）
   */
  overscan?: number;
  /**
   * 滚动容器 ref
   */
  scrollElementRef?: React.RefObject<HTMLDivElement | null>;
}

export interface UseTableVirtualizationResult<Row> {
  /**
   * 行虚拟化器
   */
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  /**
   * 虚拟化行项
   */
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    size: number;
  }>;
  /**
   * 总高度
   */
  totalSize: number;
  /**
   * 顶部 padding（用于虚拟化）
   */
  paddingTop: number;
  /**
   * 底部 padding（用于虚拟化）
   */
  paddingBottom: number;
  /**
   * 滚动位置（scrollLeft）
   */
  scrollLeft: number;
  /**
   * 容器宽度
   */
  containerWidth: number;
}

/**
 * 管理虚拟化逻辑
 */
export function useTableVirtualization<Row>(
  options: UseTableVirtualizationOptions<Row>
): UseTableVirtualizationResult<Row> {
  const {
    store,
    estimateRowHeight = 36,
    overscan = 12,
    scrollElementRef
  } = options;

  const parentRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // 订阅数据行
  const rows = store((state) => state.data.rows);

  // 监听滚动事件更新 scrollLeft
  useEffect(() => {
    const container =
      scrollElementRef?.current ||
      scrollContainerRef.current ||
      parentRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollLeft(container.scrollLeft);
      setContainerWidth(container.clientWidth);
    };

    handleScroll(); // 初始设置
    container.addEventListener('scroll', handleScroll);
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollElementRef]);

  // 行虚拟化
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () =>
      scrollElementRef?.current ||
      scrollContainerRef.current ||
      parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1]!.end
      : 0;

  return {
    rowVirtualizer,
    virtualItems,
    totalSize,
    paddingTop,
    paddingBottom,
    scrollLeft,
    containerWidth
  };
}
