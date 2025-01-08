declare module 'screenshot-desktop' {
    interface ScreenshotOptions {
      format?: 'png' | 'jpg';
      screen?: number | string;
    }
    export function screenshot(options?: ScreenshotOptions): Promise<Buffer>;
}
  