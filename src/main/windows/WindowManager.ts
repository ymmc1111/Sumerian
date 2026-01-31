import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { PanelType } from '../../renderer/types/layout';

interface DetachedWindow {
  id: string;
  panelType: PanelType;
  window: BrowserWindow;
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

export class WindowManager {
  private detachedWindows: Map<string, DetachedWindow> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  detachPanel(panelType: PanelType, bounds?: { x: number; y: number; width: number; height: number }): string {
    const id = `detached-${panelType}-${Date.now()}`;

    const defaultBounds = bounds || this.getDefaultBounds(panelType);

    // Get preload path - use same path as main window
    const preloadPath = path.join(__dirname, 'preload.cjs');

    const window = new BrowserWindow({
      x: defaultBounds.x,
      y: defaultBounds.y,
      width: defaultBounds.width,
      height: defaultBounds.height,
      minWidth: 300,
      minHeight: 200,
      frame: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // DevTools can be opened manually with Cmd+Option+I

    // Load the same app but with a query param to indicate detached panel
    const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
      ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}?detached=${panelType}&windowId=${id}`
      : `file://${path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)}?detached=${panelType}&windowId=${id}`;

    window.loadURL(url);

    window.on('closed', () => {
      this.detachedWindows.delete(id);
      // Notify main window that panel was reattached
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('window:panel-closed', { id, panelType });
      }
    });

    this.detachedWindows.set(id, { id, panelType, window });

    return id;
  }

  reattachPanel(windowId: string): boolean {
    const detached = this.detachedWindows.get(windowId);
    if (!detached) return false;

    detached.window.close();
    this.detachedWindows.delete(windowId);
    return true;
  }

  getDetachedPanels(): Array<{ id: string; panelType: PanelType }> {
    return Array.from(this.detachedWindows.values()).map(({ id, panelType }) => ({
      id,
      panelType,
    }));
  }

  focusWindow(windowId: string): boolean {
    const detached = this.detachedWindows.get(windowId);
    if (!detached) return false;

    detached.window.focus();
    return true;
  }

  moveWindowToScreen(windowId: string, screenIndex: number): boolean {
    const detached = this.detachedWindows.get(windowId);
    if (!detached) return false;

    const displays = screen.getAllDisplays();
    if (screenIndex >= displays.length) return false;

    const display = displays[screenIndex];
    const { x, y, width, height } = display.workArea;

    // Center the window on the target screen
    const windowBounds = detached.window.getBounds();
    const newX = x + Math.floor((width - windowBounds.width) / 2);
    const newY = y + Math.floor((height - windowBounds.height) / 2);

    detached.window.setPosition(newX, newY);
    return true;
  }

  getAvailableScreens(): Array<{ index: number; label: string; bounds: Electron.Rectangle }> {
    return screen.getAllDisplays().map((display, index) => ({
      index,
      label: display.label || `Display ${index + 1}`,
      bounds: display.workArea,
    }));
  }

  private getDefaultBounds(panelType: PanelType): { x: number; y: number; width: number; height: number } {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workArea;

    const defaults: Record<PanelType, { width: number; height: number }> = {
      sidebar: { width: 300, height: 600 },
      editor: { width: 800, height: 600 },
      agent: { width: 400, height: 600 },
      terminal: { width: 600, height: 300 },
    };

    const size = defaults[panelType];

    return {
      x: Math.floor((screenWidth - size.width) / 2),
      y: Math.floor((screenHeight - size.height) / 2),
      width: size.width,
      height: size.height,
    };
  }

  closeAll() {
    for (const { window } of this.detachedWindows.values()) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.detachedWindows.clear();
  }
}

export const windowManager = new WindowManager();
