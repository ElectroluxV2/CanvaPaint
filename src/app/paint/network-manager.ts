import {CompiledObject} from './protocol/compiled-object';
import {PaintMode} from './modes/paint-mode';
import {Protocol, Reference} from './protocol/protocol';
import {PacketType} from './protocol/packet-types';
import {PaintManager} from './paint-manager';
import {ControlService} from '../settings/control.service';

export class NetworkManager {
  /**
   * Holds result of requestAnimationFrame
   */
  private animationFrameForSocketsId: number;

  /**
   * Temporary location for object before they will be drawn
   */
  private compiledObjectStash: Map<string, CompiledObject> = new Map<string, CompiledObject>();

  /**
   * Controls if stash needs redraw
   */
  private compiledObjectStashNeedRedraw = false;

  /**
   * Holds socket connection to server
   */
  private connection: WebSocket;

  constructor(private modes: Map<string, PaintMode>, private predictCanvasNetworkCTX: CanvasRenderingContext2D, private paintManager: PaintManager, private controlService: ControlService) {
    this.HandleConnection();
  }

  /**
   * Used to share (transport) object between clients
   * @param object Object to share
   * @param finished Informs if object has been finished and there won't be any updates to it
   */
  public ShareCompiledObject(object: CompiledObject, finished: boolean): void {

    const serialized = this.modes.get(object.name)?.SerializeObject(object);
    if (serialized) {
      this.connection.send(`t:o,f:${finished ? 't' : 'f'},${serialized}`);
    } else {
      console.warn(`Empty object from ${object.name}!`);
    }
  }

  public SendClear(): void {
    this.connection.send('t:c');
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
    this.animationFrameForSocketsId = window.requestAnimationFrame(this.ConnectionDrawLoop.bind(this));
  }

  private OnConnectionMessage(data: string): void {
    const reader = new Protocol.Reader(data);

    // Pass by reference
    const packetType = new Reference<PacketType>();
    reader.AddMapping<PacketType>('t', 'value', packetType, Protocol.ReadPacketType);
    reader.Read('t');

    if (packetType.value === PacketType.UNKNOWN) {
      console.warn('Bad data');
      return;
    }

    if (packetType.value === PacketType.CLEAR) {
      return this.controlService.clear.next();
    }

    if (packetType.value !== PacketType.OBJECT) {
      console.warn(`Unsupported packet type: "${packetType.value}"`);
      return;
    }

    // Read finished flag
    const finished = new Reference<boolean>();
    // Read object name
    const name = new Reference<string>();
    reader.AddMapping<boolean>('f', 'value', finished, Protocol.ReadBoolean);
    reader.AddMapping<string>('n', 'value', name, Protocol.ReadString);
    reader.Read('n');

    // Unsupported
    if (!this.modes.has(name.value)) {
      console.warn(`Unsupported object type: "${name.value}"`);
      return;
    }

    // Read whole object
    const object = this.modes.get(name.value).ReadObject(data, reader.GetPosition()) as CompiledObject;
    if (!object) {
      console.warn(`Mode "${name.value}" failed to read network object`);
      return;
    }

    if (finished.value) {
      // TODO: Fix ordering
      this.paintManager.SaveCompiledObject(object);

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

    this.connection = new WebSocket('ws://ip.budziszm.pl:3000');
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
}
