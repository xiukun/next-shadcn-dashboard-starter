'use client';

import React, { RefObject, memo, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface KeepAliveRouteProps {
  parentDomRef: RefObject<HTMLElement | null>;
  activeKey: string;
  pageKey: string;
  children: React.ReactNode;
}

/**
 * Keep-Alive Route 组件
 * 管理单个路由的缓存状态和 DOM 渲染
 * 使用 React Portal 和 DOM 操作实现 DOM 节点的显示/隐藏
 */
function KeepAliveRoute({
  parentDomRef,
  activeKey,
  pageKey,
  children
}: KeepAliveRouteProps) {
  const isActive = activeKey === pageKey;
  const isAliveRef = useRef(false);
  const aliveDomId = `alive-${pageKey}`;

  // 创建 DOM 容器元素
  const aliveDom = useMemo(() => {
    const dom = document.createElement('div');
    dom.setAttribute('id', aliveDomId);
    dom.setAttribute('data-page-key', pageKey);
    dom.setAttribute('data-keep-alive', 'true');
    dom.style.width = '100%';
    /**
     * 关键：aliveDom 必须作为 flex item 参与高度分配
     * 否则内部页面（如 DataTable）大量使用 `flex-1` + `absolute inset-0` 会高度塌陷。
     */
    dom.style.display = 'flex';
    dom.style.flexDirection = 'column';
    dom.style.flex = '1 1 auto';
    dom.style.minHeight = '0';
    return dom;
  }, [aliveDomId, pageKey]);

  // 标记为已激活
  if (isActive && !isAliveRef.current) {
    isAliveRef.current = true;
  }

  // 管理 DOM 节点的显示/隐藏（active -> parent，inactive -> detach）
  useEffect(() => {
    const parent = parentDomRef.current;
    if (!parent) return;

    if (isActive) {
      const existingDom = document.getElementById(aliveDomId);
      if (existingDom && parent.contains(existingDom)) {
        parent.removeChild(existingDom);
      }
      if (aliveDom.parentNode && aliveDom.parentNode !== parent) {
        aliveDom.parentNode.removeChild(aliveDom);
      }
      parent.appendChild(aliveDom);
    } else {
      if (parent.contains(aliveDom)) {
        parent.removeChild(aliveDom);
      }
    }

    // 清理函数：组件卸载时移除 DOM 节点
    return () => {
      if (aliveDom.parentNode) {
        aliveDom.parentNode.removeChild(aliveDom);
      }
    };
  }, [isActive, aliveDom, aliveDomId, parentDomRef]);

  // 只有已激活过的路由才渲染（避免未访问的路由被缓存）
  if (!isAliveRef.current) {
    return null;
  }

  // 使用 createPortal 将 children 渲染到 DOM 容器
  return createPortal(children, aliveDom, aliveDomId);
}

export default memo(KeepAliveRoute);
