import { PACKET_TYPES, PacketType } from './packet-types';
import { Point } from './point';
import { CompiledObject } from '../compiled-objects/compiled-object';
import { Box } from '../compiled-objects/box';

interface ReaderMapping<T> {
  variable: string;
  destination: Reference<any> | CompiledObject;
  parser: (data: string, currentPosition: Reference<number>) => T;
}

export class Reference<T> {
  value: T;

  constructor(value?: T) {
    this.value = value;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Protocol {
  export class Builder {
    protected properties: Map<string, string> = new Map<string, string>();
    private typeProvided = false;
    private nameProvided = false;

    public setType(type: PacketType): void {
      this.properties.set('t', type);

      this.typeProvided = true;
    }

    public setName(name: string): void {
      if (!this.typeProvided) {
        throw new Error('You must provide type first!');
      }

      this.nameProvided = true;

      this.properties.set('n', name);
    }

    public setProperty(name: string, value: string | number | Point[] | Point | Box): void {
      if (!this.typeProvided) {
        throw new Error('You must provide type first!');
      }

      if (!this.nameProvided) {
        throw new Error('You must provide name first!');
      }

      let stringValue;
      if (typeof value === 'number') {
        stringValue = value.toFixed(2);
      } else if (value instanceof Box) {
        stringValue = encodeBox(value);
      } else if (value instanceof Point) {
        stringValue = encodePoint(value);
      } else if (Array.isArray(value)) {
        stringValue = encodeArray<Point>(value, encodePoint);
      } else {
        stringValue = value;
      }

      this.properties.set(name, stringValue);
    }

    public toString(): string {
      const items = [];

      for (const [name, value] of this.properties) {
        items.push(encodeProperty(name, value));
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

    public addMapping<T>(selector: string, variable: string, destination: Reference<any> | CompiledObject, parser: (data: string, currentPosition: Reference<number>) => T): void {
      this.mappings.set(selector, {
        variable,
        destination,
        parser
      });
    }

    public addArrayMapping<T>(selector: string, variable: string, destination: Reference<any> | CompiledObject, parser: (data: string, currentPosition: Reference<number>) => T): void {
      this.arrayMappings.set(selector, {
        variable,
        destination,
        parser
      });
    }

    public read(stopOnSection?: string): void {
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
            mapping.destination[mapping.variable] = readArray<any>(mapping.parser, this.data, this.currentPosition);
          }

          if (c1 === stopOnSection) {
            break;
          }
        }

      } while (this.currentPosition.value + 1 < this.data.length && this.currentPosition.value++);
    }

    public getPosition(): Reference<number> {
      return this.currentPosition;
    }
  }

  export const encodePoint = (point: Point): string => `${point.x.toFixed(2)};${point.y.toFixed(2)}`;

  export const encodeBox = (box: Box): string => encodeArray<Point>([box.topLeft, box.bottomRight], encodePoint);

  export const encodeArray = <T>(array: T[], itemEncoder: (item: T) => string): string => {
    const items = [];

    for (const item of array) {
      items.push(itemEncoder(item));
    }

    return items.join('^');
  };

  export const encodeProperty = (name: string, value: string): string => `${name}:${value}`;

  export const readPacketType = (data: string, currentPosition: Reference<number>): PacketType => {
    let packetType = PacketType.UNKNOWN;

    const c3 = data[currentPosition.value];

    packetType = PACKET_TYPES.get(c3);
    currentPosition.value++;

    return packetType;
  };

  export const readBoolean = (data: string, currentPosition: Reference<number>): boolean => {
    const c = data[currentPosition.value++];
    return c === 't' || c === '1';
  };

  export const readString = (data: string, currentPosition: Reference<number>): string => {
    let value = '';

    do {
      const c = data[currentPosition.value];
      if (c === ',') {
        return value;
      }

      value += c;
    } while (data[currentPosition.value + 1] !== undefined && currentPosition.value < data.length && currentPosition.value++);

    return value;
  };

  export const readNumber = (data: string, currentPosition: Reference<number>): number => {
    let toParse = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') {
        return Number.parseInt(toParse, 10);
      }

      toParse += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    return null;
  };

  export const readArray = <T>(itemParser: (stringData: string, currentPosition: Reference<number>) => T, data: string, currentPosition: Reference<number>): T[] => {
    const array = [];

    // Read items
    do {
      array.push(itemParser(data, currentPosition));
    } while (data[currentPosition.value] !== ',' && currentPosition.value < data.length && currentPosition.value++);

    return array;
  };

  export const readPoint = (data: string, currentPosition: Reference<number>): Point => {
    let s1 = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',') {
        break;
      }
      if (c === ';') {
        currentPosition.value++;
        break;
      }

      s1 += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    let s2 = '';
    do {
      const c = data[currentPosition.value];
      if (c === ',' || c === '^') {
        break;
      }

      s2 += c;
    } while (currentPosition.value < data.length && currentPosition.value++);

    const x = Number.parseFloat(s1);
    const y = Number.parseFloat(s2);

    return new Point(x, y);
  };

  export const readBox = (data: string, currentPosition: Reference<number>): Box => {
    const points = readArray<Point>(readPoint, data, currentPosition);
    return new Box(points[0], points[1]);
  };

  export const generateId = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
