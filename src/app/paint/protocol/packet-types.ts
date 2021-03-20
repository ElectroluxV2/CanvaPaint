/**
 * Holds enums for packets
 */
export enum PacketType {
  OBJECT = 'o',
  CLEAR = 'c',
  UNKNOWN = '~'
}

/**
 * Known list of packet types
 */
export const PACKET_TYPES = new Map([
  ['o', PacketType.OBJECT],
  ['c', PacketType.CLEAR],
]);
