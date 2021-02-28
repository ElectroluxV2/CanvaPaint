
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

  static ReadArray<T1 extends Array<T2>, T2>(arrayType: new() => T1, itemType: new() => T2, itemParser: (stringData: string) => T2, data: string, selector: string, currentPosition: { value: number } = { value: 0 }): T1 {
    const array = new arrayType();

    /*console.log(itemType);

    for (let i = 0; i < 10; i++) {
      array.push(new itemType());
    }

   // console.log(array);*/

    do {

      const c1 = data[currentPosition.value];
      const c2 = data[currentPosition.value + 1];

      // Find selector:
      if (c1 !== selector) { continue; }
      if (c2 !== ':') { continue; }

      let s1 = '';
      do {
        const c3 = data[currentPosition.value + 2];
        if (c3 === ',') { break; }
        if (c3 === ';') {
          currentPosition.value++;
          break;
        }

        s1 += c3;
      } while (currentPosition.value + 2 < data.length && currentPosition.value++);

      let s2 = '';
      do {
        const c3 = data[currentPosition.value + 2];
        if (c3 === ',') { break; }
        if (c3 === '^') { break; }

        s2 += c3;
      } while (currentPosition.value + 2 < data.length && currentPosition.value++);

      console.log(s1);
      console.log(s2);

      break;
    } while (currentPosition.value + 2 < data.length && currentPosition.value++);

    return null;
  }
}
