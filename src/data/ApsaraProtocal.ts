export type ApsaraProtocal = 'rtmp' | 'flv' | 'm3u8' | 'hls' | 'udp'

export const ApsaraProtocals: { [key in ApsaraProtocal]: string } = {
  rtmp: 'rtmp',
  flv: 'flv',
  m3u8: 'm3u8',
  hls: 'hls', // also m3u8
  udp: 'udp'
}
