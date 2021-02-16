import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { createHmac } from 'crypto'
import createHttpError from 'http-errors'
import { escape } from 'querystring'
import { v4 as uuidv4 } from 'uuid'

import { API_VERSION, BASE_URL, FORMAT, SIGNATURE_METHOD, SIGNATURE_VERSION, TIMEOUT } from './constants'
import { ApsaraDomainsData } from './data/ApsaraDomainsData'
import { ApsaraErrorData } from './data/ApsaraErrorData'
import { AsparaOptions } from './data/ApsaraOptions'
import { ApsaraParams } from './data/ApsaraParams'
import { Logger } from './data/Logger'

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
    return this.request<ApsaraDomainsData>({ Action: 'DescribeLiveUserDomains' })
  }

  // Private

  /**
   * Make HTTP request to Apsara open API
   * @param {object} params
   */
  private async request<T>(params: Record<string, string>): Promise<T> {
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
    const signature: string = this.generateSignature({ ...commonParams, ...params }, method)

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
  private generateSignature(payload: any, method: string): string {
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
}
