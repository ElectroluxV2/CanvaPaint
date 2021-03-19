import {EventEmitter, NgZone} from '@angular/core';
import {PaintMode} from '../curves/modes/paint-mode';
import {FreeLineMode} from '../curves/modes/free-line-mode';
import {ControlService} from '../settings/control.service';
import {Settings} from '../settings/settings.interface';
import {StraightLineMode} from '../curves/modes/straight-line-mode';
import {ContinuousStraightLineMode} from '../curves/modes/continuous-straight-line-mode';
import {CompiledObject, PacketType, Point, Protocol} from './protocol';

declare global {
  interface CanvasRenderingContext2D {
    /**
     * Clears context
     */
    clear(): void;
    /**
     * Draws dot onto predict canvas
     * @param position position of dot
     * @param width width of dot
     * @param color color of dot
     */
    dot(position: Point, width: number, color: string): void;
  }
}

export interface PaintManager {
  /**
   * Starts animation loop
   */
  StartFrameUpdate(): void;
  /**
   * Stops animation loop
   */
  StopFrameUpdate(): void;

  /**
   * Requests single frame update
   * Does not impact animation loop
   */
  SingleFrameUpdate(): void;
  /**
   * Saves compiled object
   * Draws compiled object
   * @param object Object to save
   */
  SaveCompiledObject(object: CompiledObject): void;

  /**
   * Used to share (transport) object between clients
   * @param object Object to share
   * @param finished Informs if object has been finished and there won't be any updates to it
   */
  ShareCompiledObject(object: CompiledObject, finished: boolean): void;
  /**
   * @param point to normalize
   * @param enhance whenever to multiply by device dpi
   * @returns Normalized point
   */
  NormalizePoint(point: Point, enhance?: boolean): Point;
}

export class Paint {
  /**
   * Holds result of requestAnimationFrame
   */
  private animationFrameForModesId: number;
  private animationFrameForSocketsId: number;
  readonly mainCanvasCTX: CanvasRenderingContext2D;
  readonly predictCanvasCTX: CanvasRenderingContext2D;
  readonly predictCanvasNetworkCTX: CanvasRenderingContext2D;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  private currentMode: PaintMode;
  private modes: Map<string, PaintMode> = new Map<string, PaintMode>();
  private currentSettings: Settings;
  private manager: PaintManager = {} as PaintManager;
  /**
   * Holds socket connection to server
   */
  private connection: WebSocket;

  /**
   * Contains all compiled objects
   */
  public compiledObjectStorage: Map<string, Array<CompiledObject>> = new Map<string, []>();
  /**
   * Temporary location for object before they will be drawn
   */
  private compiledObjectStash: Map<string, CompiledObject> = new Map<string, CompiledObject>();
  /**
   * Controls if stash needs redraw
   */
  private compiledObjectStashNeedRedraw = false;

  constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private predictCanvasNetwork: HTMLCanvasElement, private controlService: ControlService) {
    // Setup canvas, remember to rescale on window resize
    mainCanvas.height = mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    mainCanvas.width = mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;
    this.mainCanvasCTX = mainCanvas.getContext('2d');

    predictCanvas.height = mainCanvas.height;
    predictCanvas.width = mainCanvas.width;
    this.predictCanvasCTX = predictCanvas.getContext('2d');

    predictCanvasNetwork.height = mainCanvas.height;
    predictCanvasNetwork.width = mainCanvas.width;
    this.predictCanvasNetworkCTX = predictCanvasNetwork.getContext('2d');

    this.InjectCanvas();

    this.PrepareManager();

    this.HandleModes();

    this.ResponseToControlService();

    this.HandleEvents();

    this.HandleConnection();
  }

  private HandleEvents(): void {
    // Events
    this.predictCanvas.oncontextmenu = (event: MouseEvent) => {
      // Make right click possible to be caught in pointer down event
      event.preventDefault();
    };

    this.predictCanvas.onwheel = (event: WheelEvent) => {
      event.preventDefault();
      this.currentMode?.OnWheel?.(event);
    };

    this.predictCanvas.onpointerover = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerOver?.(event);
    };

    this.predictCanvas.onpointerenter = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerEnter?.(event);
    };

    this.predictCanvas.onpointerdown = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerDown?.(event);
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerMove?.(event);
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerUp?.(event);
    };

    this.predictCanvas.onpointercancel = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerCancel?.(event);
    };

    this.predictCanvas.onpointerout = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerOut?.(event);
    };

    this.predictCanvas.onpointerleave = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerLeave?.(event);
    };

    this.predictCanvas.ongotpointercapture = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerGotCapture?.(event);
    };

    this.predictCanvas.onlostpointercapture = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerLostCapture?.(event);
    };
  }

  private InjectCanvas(): void {
    // Inject additional methods
    this.mainCanvasCTX.clear = () => {
      this.mainCanvasCTX.clearRect(0, 0, this.mainCanvasCTX.canvas.width, this.mainCanvasCTX.canvas.height);
    };

    this.predictCanvasCTX.clear = () => {
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvasCTX.canvas.width, this.predictCanvasCTX.canvas.height);
    };

    this.predictCanvasNetworkCTX.clear = () => {
      this.predictCanvasNetworkCTX.clearRect(0, 0, this.predictCanvasNetworkCTX.canvas.width, this.predictCanvasNetworkCTX.canvas.height);
    };

    const dot = (canvas: CanvasRenderingContext2D, position: Point, width: number, color: string) => {
      canvas.beginPath();
      canvas.arc(
        position.x,
        position.y,
        width / Math.PI,
        0,
        2 * Math.PI,
        false
      );
      canvas.fillStyle = color;
      canvas.fill();
    };

    this.mainCanvasCTX.dot = (position: Point, width: number, color: string) => dot(this.mainCanvasCTX, position, width, color);
    this.predictCanvasCTX.dot = (position: Point, width: number, color: string) => dot(this.predictCanvasCTX, position, width, color);
  }

  private PrepareManager(): void {
    // Setup paint manager
    this.manager.StartFrameUpdate = () => {
      // Start new loop, obtain new id
      this.ngZone.runOutsideAngular(() => {
        this.currentMode?.OnFrameUpdate?.();
        this.animationFrameForModesId = window.requestAnimationFrame(this.manager.StartFrameUpdate.bind(this));
      });
    };

    this.manager.StopFrameUpdate = () => {
      window.cancelAnimationFrame(this.animationFrameForModesId);
    };

    this.manager.SingleFrameUpdate = () => {
      this.ngZone.runOutsideAngular(() => {
        window.requestAnimationFrame(() => {
          this.currentMode?.OnFrameUpdate();
        });
      });
    };

    this.manager.SaveCompiledObject = object => {
      if (!this.compiledObjectStorage.has(object.name)) {
        this.compiledObjectStorage.set(object.name, []);
      }

      this.compiledObjectStorage.get(object.name).push(object);
      this.modes.get(object.name).ReproduceObject(this.mainCanvasCTX, object);
    };

    this.manager.ShareCompiledObject = (object, finished = false) => {

      const serialized = this.modes.get(object.name)?.SerializeObject(object);
      if (serialized) {
        this.connection.send(`t:o,f:${finished ? 't' : 'f'},${serialized}`);
      } else {
        console.warn(`Empty object from ${object.name}!`);
      }
    };

    this.manager.NormalizePoint = (point, enhance= false) => {
      // Make sure the point does not go beyond the screen
      point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
      point[0] = point[0] < 0 ? 0 : point[0];

      point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
      point[1] = point[1] < 0 ? 0 : point[1];

      if (!enhance) {
        return point;
      }

      point[0] *= window.devicePixelRatio;
      point[1] *= window.devicePixelRatio;

      return point;
    };
  }

  private HandleModes(): void {
    // Setup modes
    this.currentSettings = this.controlService.settings.value;

    const modesArray = [
      new FreeLineMode(this.predictCanvasCTX, this.manager, this.currentSettings),
      new StraightLineMode(this.predictCanvasCTX, this.manager, this.currentSettings),
      new ContinuousStraightLineMode(this.predictCanvasCTX, this.manager, this.currentSettings)
    ];

    const nameRegex = new RegExp('\([A-z]+([A-z]|-|[0-9])+)\S', 'g');

    for (const mode of modesArray) {

      if (!('name' in mode)) {
        console.warn(`Cannot add mode without name!`);
        continue;
      }

      if (nameRegex.test(mode.name)) {
        console.warn(`Mode with name "${mode.name}" doesn't match name regex!`);
        continue;
      }

      this.modes.set(mode.name, mode);
    }

    this.currentMode = this.modes.get(this.controlService.mode.value);
    this.controlService.mode.subscribe(mode => {
      if (!this.modes.has(mode)) {
        console.warn(`No mode named ${mode}!`);
        return;
      }
      this.currentMode?.OnUnSelected?.();
      this.currentMode = this.modes.get(mode);
      this.currentMode?.OnSelected?.();
    });
  }

  private ResponseToControlService(): void {
    // Response to settings change
    this.controlService.settings.subscribe(newSettings => {
      this.currentMode?.OnSettingsUpdate(newSettings);

      // When color scheme has changed we need to redraw with different palette colour
      if (this.currentSettings?.darkModeEnabled !== newSettings.darkModeEnabled) {
        this.currentSettings = newSettings;
        this.ReDraw();
      } else {
        this.currentSettings = newSettings;
      }
    });

    // Response to clear
    this.controlService.clear.subscribe(() => {
      this.mainCanvasCTX.clear();
      this.predictCanvasCTX.clear();
      this.compiledObjectStorage.clear();
      this.currentMode?.MakeReady?.();
    });
  }

  private ConnectionDrawLoop(): void {

    if (this.compiledObjectStashNeedRedraw) {
      // Clear predict from network
      this.predictCanvasNetworkCTX.clear();

      // TODO: Object can stuck here forever
      // Here we will iterate through objects transferred from sockets
      for (const [id, object] of this.compiledObjectStash) {
        if (!this.modes.has(object.name)) {
          console.warn(`Missing mode: ${object.name}`);
          continue;
        }

        this.modes.get(object.name).ReproduceObject(this.predictCanvasNetworkCTX, object);
      }

      this.compiledObjectStashNeedRedraw = false;
    }

    // Start new loop, obtain new id
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameForSocketsId = window.requestAnimationFrame(this.ConnectionDrawLoop.bind(this));
    });
  }

  private OnConnectionMessage(data: string): void {
    // Pass by reference
    const currentPosition = { value: 0 };
    const packetType = Protocol.ReadPacketType(data, currentPosition);

    if (packetType === PacketType.UNKNOWN) {
      console.warn('Bad data');
      return;
    }

    if (packetType !== PacketType.OBJECT) {
      console.warn(`Unsupported packet type: "${packetType}"`);
      return;
    }

    // Read finished flag
    const finished = Protocol.ReadBoolean(data, 'f', currentPosition);

    if (finished === null) {
      console.warn(`Missing finished flag!`);
      return;
    }

    // Read object name
    const name = Protocol.ReadString(data, 'n', currentPosition);

    // Unsupported
    if (!this.modes.has(name)) {
      console.warn(`Unsupported object type: "${name}"`);
      return;
    }

    // Read whole object
    const object = this.modes.get(name).ReadObject(data, currentPosition) as CompiledObject;
    if (!object) {
      console.warn(`Mode "${name}" failed to read network object`);
      return;
    }

    if (finished) {
      // TODO: Fix ordering
      this.manager.SaveCompiledObject(object);

      if (this.compiledObjectStash.has(object.id)) {
        this.compiledObjectStashNeedRedraw = true;
        this.compiledObjectStash.delete(object.id);
      }

    } else {
      this.compiledObjectStashNeedRedraw = true;
      this.compiledObjectStash.set(object.id, object);
    }
  }

  private HandleConnection(): void {
    this.ConnectionDrawLoop();

    this.connection = new WebSocket('ws://localhost:3000');
    this.connection.onopen = () => {
      console.info('Connected to server');
    };

    this.connection.onmessage = ({data}) => {
      this.OnConnectionMessage(data);
    };

    this.connection.onclose = event => {
      console.warn(`Connection unexpectedly closed: #${event.code} ${event.reason.length !== 0 ? ', reason: ' + event.reason : ''}. Reconnecting in 1 second.`);
      // Reconnect
      setTimeout(this.HandleConnection.bind(this), 1000);
    };

    this.connection.onerror = event => {
      console.warn(`An error occurred in socket!`);
      event.stopImmediatePropagation();
    };
  }

  public Resize(): void {
    this.mainCanvas.height = this.mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    this.mainCanvas.width = this.mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;

    this.predictCanvas.height = this.mainCanvas.height;
    this.predictCanvas.width = this.mainCanvas.width;

    this.predictCanvasNetwork.height = this.mainCanvas.height;
    this.predictCanvasNetwork.width = this.mainCanvas.width;

    this.ReDraw();
  }

  public ReDraw(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();

    for (const [name, objects] of this.compiledObjectStorage) {
      for (const compiledObject of objects) {
        this.modes.get(name).ReproduceObject(this.mainCanvasCTX, compiledObject);
      }
    }

    this.currentMode?.MakeReady?.();
  }
}
