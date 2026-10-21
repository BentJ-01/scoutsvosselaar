// Minimal types for page-flip 2.0.7, which ships without declarations.
declare module 'page-flip' {
  export interface PageFlipSettings {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startPage?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    swipeDistance?: number;
    disableFlipByClick?: boolean;
  }
  export interface PageFlipEvent<T> {
    data: T;
  }
  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    on(event: 'flip', cb: (e: PageFlipEvent<number>) => void): this;
    on(event: 'init' | 'update', cb: (e: PageFlipEvent<{ page: number; mode: 'portrait' | 'landscape' }>) => void): this;
    on(event: 'changeOrientation', cb: (e: PageFlipEvent<'portrait' | 'landscape'>) => void): this;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): 'portrait' | 'landscape';
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    turnToPage(page: number): void;
    update(): void;
    getSettings(): Required<PageFlipSettings>;
    destroy(): void;
  }
}
