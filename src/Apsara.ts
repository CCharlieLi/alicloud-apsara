import axios, { AxiosInstance, AxiosResponse } from 'axios'
import crypto, { createHmac } from 'crypto'
import { addSeconds } from 'date-fns'
import createHttpError from 'http-errors'
import { escape } from 'querystring'
import { URL } from 'url'
import { v4 as uuidv4 } from 'uuid'

import { API_VERSION, BASE_URL, FORMAT, SIGNATURE_METHOD, SIGNATURE_VERSION, TIMEOUT } from './constants'
import {
  ApsaraDomainsData,
  ApsaraErrorData,
  ApsaraIngestUrlParams,
  ApsaraParams,
  ApsaraProtocal,
  ApsaraStreamingUrlParams,
  ApsaraUrlParams,
  AsparaOptions,
  Logger
} from './data'

export class Apsara {
  private options: AsparaOptions
  private axios: AxiosInstance
  private logger?: Logger

  constructor(options: AsparaOptions, logger?: Logger) {
    this.options = {
      version: API_VERSION,
      signatureMethod: SIGNATURE_METHOD,
      signatureVersion: SIGNATURE_VERSION,
      format: FORMAT,
      ...options
    }
    this.logger = logger
    this.axios = axios.create({
      baseURL: options.baseUrl || BASE_URL,
      timeout: options.timeout || TIMEOUT
    })
  }

  /**
   * Fetch all domains from current Apsara account
   * See https://www.alibabacloud.com/help/zh/doc-detail/88332.htm?spm=a2c63.p38356.b99.153.6e601545HUfO2U
   */
  async getDomains(): Promise<ApsaraDomainsData> {
    this.logger?.info(`Get domains of current Apsara account`)
    return this._request<ApsaraDomainsData>({ Action: 'DescribeLiveUserDomains' })
  }

  /**
   * Create ingest URL with signature
   */
  getIngestUrl({ domain, appName, streamName, expiredIn, key }: ApsaraIngestUrlParams): Promise<URL> {
    const protocol = 'rtmp:'
    const extension = this._getFileExtension('rtmp' as ApsaraProtocal)
    return this._generateUrl({ protocol, domain, appName, streamName, extension, expiredIn, key })
  }

  /**
   * Create streaming URL with signature
   */
  getVideoStreamingUrl({
    domain,
    appName,
    streamName,
    expiredIn,
    key,
    format,
    isSecure
  }: ApsaraStreamingUrlParams): Promise<URL> {
    const protocol = this._getProtocol(format, isSecure)
    const extension = this._getFileExtension(format)
    return this._generateUrl({ protocol, domain, appName, streamName, extension, expiredIn, key })
  }

  // Private

  /**
   * Generate Apsara ingest/streaming URL with signature
   * See https://help.aliyun.com/document_detail/199349.html?spm=a2c4g.11186623.2.4.36005f12Jui3YZ
   * @param protocol
   * @param domain
   * @param appName
   * @param streamName
   * @param extension
   * @param expiredIn seconds
   * @param key
   */
  private async _generateUrl({
    protocol,
    domain,
    appName,
    streamName,
    extension,
    expiredIn,
    key
  }: ApsaraUrlParams): Promise<URL> {
    const unixTimestamp = Math.trunc(addSeconds(new Date(), expiredIn).getTime() / 1000)
    const signature = `${appName}/${streamName}/${extension}-${unixTimestamp}-0-0-${key}`
    const hashedSignature = crypto.createHash('md5').update(signature).digest('hex')
    return new URL(
      `${protocol}//${domain}/${appName}/${streamName}${extension}?auth_key=${unixTimestamp}-0-0-${hashedSignature}`
    )
  }

  /**
   * Make HTTP request to Apsara open API
   * @param {object} params
   */
  private async _request<T>(params: Record<string, string>): Promise<T> {
    this.logger?.info(`Send request to Apsara with payload ${JSON.stringify(params)}`)

    // create payload
    const method = 'get'
    const commonParams: ApsaraParams = {
      Format: this.options.format as string,
      Version: this.options.version as string,
      SignatureMethod: this.options.signatureMethod as string,
      SignatureVersion: this.options.signatureVersion as string,
      AccessKeyId: this.options.accessKeyId,
      SignatureNonce: uuidv4(),
      Timestamp: new Date().toISOString()
    }
    const signature: string = this._generateSignature({ ...commonParams, ...params }, method)

    // init request
    let response: AxiosResponse<T>
    try {
      response = await this.axios({
        method,
        params: {
          ...commonParams,
          ...params,
          Signature: signature
        }
      })

      const { status, data } = response
      this.logger?.info(`Request to Apsara succeed with status ${status} and data ${JSON.stringify(data)}`)
      return data as T
    } catch (err) {
      this.logger?.error(`Request to Apsara failed with response ${JSON.stringify(err.message)}`)

      // Apsara business error
      if (err?.response?.data?.RequestId) {
        const data: ApsaraErrorData = err.response.data
        const status = err.response.status
        throw createHttpError(status, data.Message, data)
      }

      // Service error
      throw createHttpError(err)
    }
  }

  /**
   * Generate signature for Apsara open API
   * See https://www.alibabacloud.com/help/zh/doc-detail/50286.htm?spm=a2c63.p38356.b99.145.2b434281pZhqqP
   * @param {object} payload
   * @param {string} method
   */
  private _generateSignature(payload: any, method: string): string {
    // sort params
    const paramsStr = Object.keys(payload)
      .map(key => (key === 'Timestamp' ? `${key}=${encodeURIComponent(payload[key])}` : `${key}=${payload[key]}`))
      .sort()
      .join('&')

    // sign
    return createHmac('sha1', `${this.options.accessKeySecret}&`)
      .update(
        `${method.toUpperCase()}&${encodeURIComponent('/')}&${escape(paramsStr)
          .replace('+', '%20')
          .replace('*', '%2A')
          .replace('%7E', '~')}`
      )
      .digest('base64')
  }

  /**
   * Get URL protocal based on given format
   * @param format
   * @param isSecure
   */
  private _getProtocol(format: ApsaraProtocal, isSecure = false): string {
    switch (format) {
      case 'rtmp':
        return 'rtmp:'
      case 'udp':
        return 'udp:'
      case 'flv':
      case 'm3u8':
      default:
        return isSecure ? 'https:' : 'http:'
    }
  }

  /**
   *  Get URL file extension based on given format
   * @param format
   */
  private _getFileExtension(format: ApsaraProtocal): string {
    switch (format) {
      case 'flv':
        return `.flv`
      case 'm3u8':
        return `.m3u8`
      case 'rtmp':
      case 'udp':
      default:
        return ''
    }
  }
}
