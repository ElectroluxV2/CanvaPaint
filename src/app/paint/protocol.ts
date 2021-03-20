// tslint:disable-next-line:no-namespace


/**
 * Represents object that contains minimalistic data on how to draw it onto canvas
 */
interface CompiledObject {
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

/**
 * Represents single point in canvas
 */
class Point {
  x: number; // Float
  y: number; // Float

  constructor(x?: number, y?: number) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  /**
   * Creates deep copy
   */
  public Duplicate(): Point {
    return new Point(this.x, this.y);
  }
}

/**
 * Holds enums for packets
 */
enum PacketType {
  OBJECT,
  CLEAR,
  UNKNOWN
}


export class Protocol {
  static readonly Builder = class {
    private type: PacketType = PacketType.UNKNOWN;
    protected properties: Map<string, string> = new Map<string, string>();

    public SetType(type: PacketType): void {
      this.type = type;
    }

    public SetProperty(name: string, value: string | number | Point[]): void {
      let stringValue;

      if (typeof value === 'number') {
        stringValue = value.toFixed(2);
      } else if (Array.isArray(value)) {
        stringValue = this.EncodeArray<Point>(value, this.EncodePoint);
      } else {
        stringValue = value;
      }

      // @ts-ignore
      this.properties.set(name, stringValue);
    }

    private EncodeArray<T>(array: T[], itemEncoder: (item: T) => string): string {
        const items = [];

        for (const item of array) {
          items.push(itemEncoder(item));
        }

        return items.join('^');
    }

    public EncodePoint(point: Point): string {
      return `${point.x.toFixed(2)};${point.y.toFixed(2)}`;
    }

    public ToString(): string {
      const items = [];

      for (const [name, value] of this.properties) {
        items.push(this.EncodeProperty(name, value));
      }

      return items.join(',');
    }

    private EncodeProperty(name: string, value: string): string {
      return `${name}:${value}`;
    }
  };

  static PACKET_TYPES = new Map([
    ['o', PacketType.OBJECT],
    ['c', PacketType.CLEAR],
  ]);

  static ReadPacketType(data: string, currentPosition: { value: number } = { value: 0 }): PacketType {
    let packetType = PacketType.UNKNOWN;

    do {
      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];
      const c3 = data[currentPosition.value + 2];

      // Find t:
      if (c1 !== 't') { continue; }
      if (c2 !== ':') { continue; }

      if (Protocol.PACKET_TYPES.has(c3)) {
        packetType = Protocol.PACKET_TYPES.get(c3);
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
