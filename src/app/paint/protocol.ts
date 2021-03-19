/**
 * Represents object that contains minimalistic data on how to draw it onto canvas
 */
export interface CompiledObject {
  /**
   * Has to be unique, used for storing in map as key, must match mode name
   * must return only 1 match with regex /([A-z]+([A-z]|-|[0-9])+)/g
   */
  name: string;
  /**
   * Unique identifier
   */
  id: string;
}

export class Point {
  x: number; // Float
  y: number; // Float

  constructor(x?: number, y?: number) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  public Duplicate(): Point {
    return new Point(this.x, this.y);
  }
}

export enum PacketType {
  OBJECT,
  CLEAR,
  UNKNOWN
}

const PACKET_TYPES = new Map([
  ['o', PacketType.OBJECT],
  ['c', PacketType.CLEAR],
]);

export class Protocol {
  static ReadPacketType(data: string, currentPosition: { value: number } = { value: 0 }): PacketType {
    let packetType = PacketType.UNKNOWN;

    do {
      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];
      const c3 = data[currentPosition.value + 2];

      // Find t:
      if (c1 !== 't') { continue; }
      if (c2 !== ':') { continue; }

      if (PACKET_TYPES.has(c3)) {
        packetType = PACKET_TYPES.get(c3);
        // Increment only when found type
        currentPosition.value += 3;
      }

      break;
    } while (currentPosition.value + 2 < data.length && currentPosition.value++);

    return packetType;
  }

  static ReadBoolean(data: string, selector: string, currentPosition: { value: number } = { value: 0 }): boolean | null {
    let value: boolean = null;

    do {

      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];
      const c3 = data[currentPosition.value + 2];

      // Find selector:
      if (c1 !== selector) { continue; }
      if (c2 !== ':') { continue; }

      value = c3 === 't' || c3 === '1';

      break;
    } while (currentPosition.value + 2 < data.length && currentPosition.value++);

    return value;
  }

  static ReadString(data: string, selector: string, currentPosition: { value: number } = { value: 0 }): string {
    let value = '';

    do {

      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];

      // Find selector:
      if (c1 !== selector) { continue; }
      if (c2 !== ':') { continue; }

      do {
        const c3 = data[currentPosition.value + 2];
        if (c3 === ',') { return value; }

        value += c3;
      } while (currentPosition.value + 2 < data.length && currentPosition.value++);

      break;
    } while (currentPosition.value + 2 < data.length && currentPosition.value++);

    return value;
  }

  static ReadNumber(data: string, selector: string, currentPosition: { value: number } = { value: 0 }): number {
    do {

      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];

      // Find selector:
      if (c1 !== selector) { continue; }
      if (c2 !== ':') { continue; }

      let toParse = '';
      do {
        const c3 = data[currentPosition.value + 2];
        if (c3 === ',') { return Number.parseInt(toParse, 10); }

        toParse += c3;
      } while (currentPosition.value + 2 < data.length && currentPosition.value++);

      break;
    } while (currentPosition.value + 2 < data.length && currentPosition.value++);

    return null;
  }

  static ReadArray<T>(itemParser: (stringData: string, currentPosition: { value: number }) => T, data: string, selector: string, currentPosition: { value: number } = { value: 0 }): T[] {
    const array = [];

    do {

      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];

      // Find selector
      if (c1 !== selector) { continue; }
      if (c2 !== ':') { continue; }

      currentPosition.value += 2;

      // Read items
      do {
        array.push(itemParser(data, currentPosition));
      } while (currentPosition.value + 1 < data.length && currentPosition.value++);
    } while (currentPosition.value + 1 < data.length && currentPosition.value++);

    return array;
  }

  static ReadPoint(data: string, currentPosition: { value: number } = { value: 0 }): Point {

    let s1 = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') { break; }
      if (c === ';') {
        currentPosition.value++;
        break;
      }

      s1 += c;
    } while (currentPosition.value + 1 < data.length && currentPosition.value++);

    let s2 = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') { break; }
      if (c === '^') { break; }

      s2 += c;
    } while (currentPosition.value + 1 < data.length && currentPosition.value++);

    const x = Number.parseFloat(s1);
    const y = Number.parseFloat(s2);

    return new Point(x, y);
  }

  static GenerateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
