interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
  preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPicture extends EventTarget {
  requestWindow(
    options?: DocumentPictureInPictureOptions
  ): Promise<Window>;
  readonly window: Window | null;
  addEventListener(
    type: "enter",
    listener: (event: DocumentPictureInPictureEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "enter",
    listener: (event: DocumentPictureInPictureEvent) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

interface DocumentPictureInPictureEvent extends Event {
  readonly window: Window;
}

interface Window {
  documentPictureInPicture?: DocumentPictureInPicture;
}
