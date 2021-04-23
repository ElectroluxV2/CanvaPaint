import { CompiledObject } from './compiled-objects/compiled-object';
import { Protocol, Reference } from './protocol/protocol';
import { PacketType } from './protocol/packet-types';
import { PaintManager } from './paint-manager';
import { ControlService } from './control.service';
import { PaintMode } from './modes/paint-mode';

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
    this.handleConnection();
  }

  /**
   * Used to share (transport) object between clients
   *
   * @param object Object to share
   * @param finished Informs if object has been finished and there won't be any updates to it
   */
  public shareCompiledObject(object: CompiledObject, finished: boolean): void {
    let builder = new Protocol.Builder();
    builder.setType(PacketType.OBJECT);
    builder.setName(object.name);
    builder.setProperty('f', finished ? 't' : 'f');

    builder = this.modes.get(object.name)?.serializeObject(object, builder);
    this.connection.send(builder.toString());
  }

  public sendClear(): void {
    this.connection.send('t:c');
  }

  public sendDelete(id: string): void {
    this.connection.send(`t:d,i:${id}`);
  }

  private connectionDrawLoop(): void {

    if (this.compiledObjectStashNeedRedraw) {
      // Clear predict from network
      this.predictCanvasNetworkCTX.clear();

      // TODO: Object can stuck here forever
      // Here we will iterate through compiled-objects transferred from sockets
      for (const [, object] of this.compiledObjectStash) {
        if (!this.modes.has(object.name)) {
          console.warn(`Missing mode: ${object.name}`);
          continue;
        }

        this.modes.get(object.name).reproduceObject(this.predictCanvasNetworkCTX, object);
      }

      this.compiledObjectStashNeedRedraw = false;
    }

    // Start new loop, obtain new id
    this.animationFrameForSocketsId = window.requestAnimationFrame(this.connectionDrawLoop.bind(this));
  }

  private onConnectionMessage(data: string): void {
    const reader = new Protocol.Reader(data);

    // Pass by reference
    const packetType = new Reference<PacketType>();
    reader.addMapping<PacketType>('t', 'value', packetType, Protocol.readPacketType);
    reader.read('t');

    if (packetType.value === PacketType.UNKNOWN) {
      console.warn('Bad data');
      return;
    }

    if (packetType.value === PacketType.CLEAR) {
      return this.controlService.clear.next(false);
    }

    if (packetType.value === PacketType.OBJECT) {
      return this.handleObjectPacket(reader);
    }

    if (packetType.value === PacketType.DELETE) {
      return this.handleDeletePacket(reader);
    }

    console.warn(`Unsupported packet type: "${packetType.value}"`);
  }

  private handleObjectPacket(reader: Protocol.Reader): void {
    // Read finished flag
    const finished = new Reference<boolean>();
    // Read object name
    const name = new Reference<string>();
    reader.addMapping<boolean>('f', 'value', finished, Protocol.readBoolean);
    reader.addMapping<string>('n', 'value', name, Protocol.readString);
    reader.read('n');

    // Unsupported
    if (!this.modes.has(name.value)) {
      console.warn(`Unsupported object type: "${name.value}"`);
      return;
    }

    // Read whole object
    const object = this.modes.get(name.value).readObject(reader) as CompiledObject;
    if (!object) {
      console.warn(`Mode "${name.value}" failed to read network object`);
      return;
    }

    // Correct color
    object.color = this.controlService.correctColor(object.color);

    if (finished.value) {
      // TODO: Fix ordering
      this.paintManager.saveCompiledObject(object);

      if (this.compiledObjectStash.has(object.id)) {
        this.compiledObjectStashNeedRedraw = true;
        this.compiledObjectStash.delete(object.id);
      }

    } else {
      this.compiledObjectStashNeedRedraw = true;
      this.compiledObjectStash.set(object.id, object);
    }
  }

  private handleDeletePacket(reader: Protocol.Reader): void {
    const id = new Reference<string>();
    reader.addMapping<string>('i', 'value', id, Protocol.readString);
    reader.read();

    this.paintManager.removeCompiledObject(id.value);
    // Remove from connection draw loop
    this.compiledObjectStash.delete(id.value);
    this.paintManager.redraw();
  }

  private handleConnection(): void {
    this.connectionDrawLoop();

    this.connection = new WebSocket('ws://ip.budziszm.pl:3000');
    this.connection.onopen = () => {
      console.info('Connected to server');
    };

    this.connection.onmessage = ({data}) => {
      this.onConnectionMessage(data);
    };

    this.connection.onclose = event => {
      console.warn(`Connection unexpectedly closed: #${event.code} ${event.reason.length !== 0 ? ', reason: ' + event.reason : ''}. Reconnecting in 1 second.`);
      // Reconnect
      setTimeout(this.handleConnection.bind(this), 1000);
    };

    this.connection.onerror = event => {
      console.warn(`An error occurred in socket!`);
      event.stopImmediatePropagation();
    };
  }
}
