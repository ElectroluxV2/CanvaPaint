/**
 * Holds enums for packets
 */
export enum PacketType {
  OBJECT = 'o',
  CLEAR = 'c',
  DELETE = 'd',
  UNKNOWN = '~'
}

/**
 * Known list of packet types
 */
export const PACKET_TYPES = new Map([
  ['o', PacketType.OBJECT],
  ['c', PacketType.CLEAR],
  ['d', PacketType.DELETE]
]);
