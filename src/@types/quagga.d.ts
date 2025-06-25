declare module 'quagga' {
  interface QuaggaConfig {
    inputStream?: {
      name?: string;
      type?: string;
      target?: any;
      constraints?: {
        width?: number;
        height?: number;
        facing?: string;
        aspectRatio?: number;
        deviceId?: string;
        frameRate?: number;
      };
      area?: {
        top?: string;
        right?: string;
        left?: string;
        bottom?: string;
      };
      singleChannel?: boolean;
    };
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
    decoder?: {
      readers?: string[];
      debug?: {
        drawBoundingBox?: boolean;
        showFrequency?: boolean;
        drawScanline?: boolean;
        showPattern?: boolean;
      };
      multiple?: boolean;
    };
    locate?: boolean;
    frequency?: number;
    numOfWorkers?: number;
    debug?: boolean;
    src?: string;
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
    box?: [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ];
    line?: [
      [number, number],
      [number, number]
    ];
    angle?: number;
    pattern?: number[];
    direction?: number;
  }

  function init(config: QuaggaConfig, callback?: (err: any) => void): Promise<void>;
  function start(): void;
  function stop(): void;
  function onDetected(callback: (result: QuaggaResult) => void): void;
  function offDetected(callback: (result: QuaggaResult) => void): void;
  function onProcessed(callback: (result: any) => void): void;
  function offProcessed(callback: (result: any) => void): void;
  function canvas(): {
    ctx: {
      image: CanvasRenderingContext2D;
      overlay: CanvasRenderingContext2D;
    };
    dom: {
      image: HTMLCanvasElement;
      overlay: HTMLCanvasElement;
    };
  };
  function decodeSingle(config: QuaggaConfig, callback: (result: QuaggaResult) => void): void;
  function setReaders(readers: string[]): void;
}

export default Quagga;
