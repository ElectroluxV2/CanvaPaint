
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
  static ReadPacketType(data: string, position = 0): { packetType: PacketType, position: number } {
    let packetType = PacketType.UNKNOWN;

    do {
      const c1 = data[position];
      const c2 = data[position + 1];
      const c3 = data[position + 2];

      // Find t:
      if (c1 !== 't') { continue; }
      if (c2 !== ':') { continue; }

      if (PACKET_TYPES.has(c3)) {
        packetType = PACKET_TYPES.get(c3);
      }

      break;
    } while (position + 2 < data.length && position++);

    return {
      packetType,
      // Increment only when found type
      position: packetType === PacketType.UNKNOWN ? position : position + 3
    };
  }

  static ReadBoolean(data: string, selector: string, position: number): { value: boolean | null, position: number } {
    let value: boolean = null;

    do {

      const c1 = data[position];
      const c2 = data[position + 1];
      const c3 = data[position + 2];

      // Find selector:
      if (c1 !== selector) { continue; }
      if (c2 !== ':') { continue; }

      value = c3 === 't' || c3 === '1';

      break;
    } while (position + 2 < data.length && position++);

    return {
      value,
      position: value === null ? position : position + 3
    };
  }
}
