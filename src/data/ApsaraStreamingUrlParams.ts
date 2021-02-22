import { ApsaraProtocal } from './ApsaraProtocal'

export interface ApsaraStreamingUrlParams {
  domain: string
  appName: string
  streamName: string
  expiredIn: number
  key: string
  format: ApsaraProtocal
  isSecure: boolean
}
