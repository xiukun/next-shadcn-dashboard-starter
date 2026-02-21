import { create } from 'zustand';

interface FullscreenStore {
  isFullscreen: boolean;
  setFullscreen: (isFullscreen: boolean) => void;
  toggleFullscreen: () => void;
}

/**
 * 检查当前是否处于全屏状态
 */
const checkFullscreen = (): boolean => {
  if (typeof document === 'undefined') return false;
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
};

/**
 * 全屏状态管理 Store
 * 管理应用的全屏状态，支持通过按钮和浏览器快捷键切换
 */
export const useFullscreenStore = create<FullscreenStore>((set, get) => {
  // 初始化状态（仅在客户端）
  const initialState =
    typeof document !== 'undefined' ? checkFullscreen() : false;

  return {
    isFullscreen: initialState,
    setFullscreen: (isFullscreen: boolean) => {
      set({ isFullscreen });
    },
    toggleFullscreen: () => {
      const { isFullscreen } = get();
      const doc = document.documentElement;

      if (!isFullscreen) {
        // 进入全屏
        if (doc.requestFullscreen) {
          doc.requestFullscreen();
        } else if ((doc as any).webkitRequestFullscreen) {
          (doc as any).webkitRequestFullscreen();
        } else if ((doc as any).mozRequestFullScreen) {
          (doc as any).mozRequestFullScreen();
        } else if ((doc as any).msRequestFullscreen) {
          (doc as any).msRequestFullscreen();
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    }
  };
});

/**
 * 初始化全屏事件监听器（应在客户端组件中调用）
 */
export function initFullscreenListeners() {
  if (typeof document === 'undefined') return;

  const handleFullscreenChange = () => {
    const isFullscreen = checkFullscreen();
    useFullscreenStore.getState().setFullscreen(isFullscreen);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);

  // 返回清理函数
  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange
    );
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  };
}
