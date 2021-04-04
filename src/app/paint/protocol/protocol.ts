import {PACKET_TYPES, PacketType} from './packet-types';
import {Point} from './point';

interface ReaderMapping<T> {
  variable: string;
  destination: object;
  parser: (data: string, currentPosition: Reference<number>) => T;
}

export class Reference<T> {
  value: T;

  constructor(value?: T) {
    this.value = value;
  }
}

export namespace Protocol {
  export class Builder {
    protected properties: Map<string, string> = new Map<string, string>();
    private typeProvided = false;
    private nameProvided = false;

    public SetType(type: PacketType): void {
      this.properties.set('t', type);

      this.typeProvided = true;
    }

    public SetName(name: string): void {
      if (!this.typeProvided) {
        throw new Error('You must provide type first!');
      }

      this.nameProvided = true;

      this.properties.set('n', name);
    }

    public SetProperty(name: string, value: string | number | Point[] | Point): void {

      if (!this.typeProvided) {
        throw new Error('You must provide type first!');
      }

      if (!this.nameProvided) {
        throw new Error('You must provide name first!');
      }

      let stringValue;
      if (typeof value === 'number') {
        stringValue = value.toFixed(2);
      } else if (value instanceof Point) {
        stringValue = EncodePoint(value);
      } else if (Array.isArray(value)) {
        stringValue = EncodeArray<Point>(value, EncodePoint);
      } else {
        stringValue = value;
      }

      this.properties.set(name, stringValue);
    }

    public ToString(): string {
      const items = [];

      for (const [name, value] of this.properties) {
        items.push(EncodeProperty(name, value));
      }

      return items.join(',');
    }
  }

  export class Reader {
    private readonly data: string;
    private readonly currentPosition: { value: number };
    private readonly mappings = new Map<string, ReaderMapping<any>>();
    private readonly arrayMappings = new Map<string, ReaderMapping<any>>();

    constructor(data: string, currentPosition?: Reference<number>) {
      this.data = data;
      this.currentPosition = currentPosition ?? new Reference<number>(0);
    }

    public AddMapping<T>(selector: string, variable: string, destination: object, parser: (data: string, currentPosition: Reference<number>) => T): void {
      this.mappings.set(selector, {
        variable,
        destination,
        parser
      });
    }

    public AddArrayMapping<T>(selector: string, variable: string, destination: object, parser: (data: string, currentPosition: Reference<number>) => T): void {
      this.arrayMappings.set(selector, {
        variable,
        destination,
        parser
      });
    }

    public Read(stopOnSection?: string): void {
      do {
        const c1 = this.data[this.currentPosition.value];
        const c2 = this.data[this.currentPosition.value + 1];

        // For every selector in string
        if (c2 === ':') {
          if (this.mappings.has(c1)) {
            const mapping = this.mappings.get(c1);

            this.currentPosition.value += 2;
            // Execute parser
            mapping.destination[mapping.variable] = mapping.parser(this.data, this.currentPosition);
          } else if (this.arrayMappings.has(c1)) {
            const mapping = this.arrayMappings.get(c1);

            this.currentPosition.value += 2;
            // Execute parser
            // https://stackoverflow.com/questions/62428986/how-to-get-generic-parameter-type-of-class-in-typescript
            mapping.destination[mapping.variable] = ReadArray<any>(mapping.parser, this.data, this.currentPosition);
          }

          if (c1 === stopOnSection) { break; }
        }

      } while (this.currentPosition.value + 1 < this.data.length && this.currentPosition.value++);
    }

    public GetPosition(): Reference<number> {
      return this.currentPosition;
    }
  }

  export function EncodePoint(point: Point): string {
    return `${point.x.toFixed(2)};${point.y.toFixed(2)}`;
  }

  export function EncodeArray<T>(array: T[], itemEncoder: (item: T) => string): string {
    const items = [];

    for (const item of array) {
      items.push(itemEncoder(item));
    }

    return items.join('^');
  }

  export function EncodeProperty(name: string, value: string): string {
    return `${name}:${value}`;
  }

  export function ReadPacketType(data: string, currentPosition: Reference<number>): PacketType {
    let packetType = PacketType.UNKNOWN;

    const c3 = data[currentPosition.value];

    if (PACKET_TYPES.has(c3)) {
      packetType = PACKET_TYPES.get(c3);
      // Increment only when found type
      currentPosition.value++;
    }

    return packetType;
  }

  export function ReadBoolean(data: string, currentPosition: Reference<number>): boolean {
    const c = data[currentPosition.value++];
    return c === 't' || c === '1';
  }

  export function ReadString(data: string, currentPosition: Reference<number>): string {
    let value = '';

    do {
      const c = data[currentPosition.value];
      if (c === ',') { return value; }

      value += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    return value;
  }

  export function ReadNumber(data: string, currentPosition: Reference<number>): number {

    let toParse = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') { return Number.parseInt(toParse, 10); }

      toParse += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    return null;
  }

  export function ReadArray<T>(itemParser: (stringData: string, currentPosition: Reference<number>) => T, data: string, currentPosition: Reference<number>): T[] {
    const array = [];

    // Read items
    do {
      array.push(itemParser(data, currentPosition));
    } while (currentPosition.value < data.length && currentPosition.value++);

    return array;
  }

  export function ReadPoint(data: string, currentPosition: Reference<number>): Point {

    let s1 = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') { break; }
      if (c === ';') {
        currentPosition.value++;
        break;
      }

      s1 += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    let s2 = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') { break; }
      if (c === '^') { break; }

      s2 += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    const x = Number.parseFloat(s1);
    const y = Number.parseFloat(s2);

    return new Point(x, y);
  }

  export function GenerateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
