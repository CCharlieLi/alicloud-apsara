import nock from 'nock'
import { URL } from 'url'

import { Apsara } from './Apsara'
import { BASE_URL } from './constants'
import { ApsaraResponseData } from './data'
import { ApsaraDomainsData } from './data/ApsaraDomainsData'

describe('Unit test', () => {
  let apsara: Apsara
  beforeEach(async () => {
    apsara = new Apsara(
      {
        accessKeyId: '123',
        accessKeySecret: '321'
      },
      console
    )
  })

  describe('Fetch domains', () => {
    it('should fetch domains successfully', async () => {
      nock(BASE_URL)
        .get(() => true)
        .reply(200, {
          Domains: {
            PageData: [
              {
                Description: '',
                LiveDomainStatus: 'online',
                DomainName: 'live-ingest.upstra-china.cc',
                LiveDomainType: 'liveEdge',
                RegionName: 'ap-southeast-1',
                GmtModified: '2020-09-14T14:31:23Z',
                GmtCreated: '2020-09-14T14:27:06Z',
                Cname: 'live-ingest.upstra-china.cc.w.alikunlun.com'
              }
            ]
          },
          TotalCount: 8,
          RequestId: '0500D05A-505D-49B1-B989-BDC9FDAB9BAD',
          PageSize: 20,
          PageNumber: 1
        })

      const res: ApsaraDomainsData = await apsara.getDomains()
      expect(res.Domains.PageData.length).toBe(1)
      expect(res.RequestId).toBe('0500D05A-505D-49B1-B989-BDC9FDAB9BAD')
    })

    it('should get error when get Apsara business error', async () => {
      nock(BASE_URL)
        .get(() => true)
        .replyWithError({
          name: 'NotFoundError',
          message: 'Specified access key is not found.',
          RequestId: '35B98711-0E9D-4133-B12F-15C45FA4C55C',
          Message: 'Specified access key is not found.',
          Recommend: 'https://error-center.aliyun.com/status/search?Keyword=InvalidAccessKeyId.NotFound&source=PopGw',
          HostId: 'live.aliyuncs.com',
          Code: 'InvalidAccessKeyId.NotFound'
        })
      try {
        await apsara.getDomains()
      } catch (err) {
        expect(err.name).toBe('NotFoundError')
        expect(err.message).toBe('Specified access key is not found.')
        expect(err.Code).toBe('InvalidAccessKeyId.NotFound')
      }
    })

    it('should get error when get service network error', async () => {
      nock(BASE_URL)
        .get(() => true)
        .replyWithError({
          name: 'InternalServerError',
          message: 'randome error'
        })

      try {
        await apsara.getDomains()
      } catch (err) {
        expect(err.name).toBe('InternalServerError')
        expect(err.message).toBe('randome error')
      }
    })
  })

  describe('Get Url', () => {
    it('should get ingest url successfully', async () => {
      const url: URL = await apsara.getIngestUrl({
        domain: 'eko.com',
        appName: 'testApp',
        streamName: 'testStream',
        expiredIn: 3600,
        key: 'testKey'
      })

      expect(url.protocol).toBe('rtmp:')
      expect(url.host).toBe('eko.com')
      expect(url.pathname).toBe('/testApp/testStream')
    })

    it('should get streaming url successfully - m3u8', async () => {
      const url: URL = await apsara.getVideoStreamingUrl({
        domain: 'eko.com',
        appName: 'testApp',
        streamName: 'testStream',
        expiredIn: 3600,
        key: 'testKey',
        format: 'm3u8',
        isSecure: true
      })

      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('eko.com')
      expect(url.pathname).toBe('/testApp/testStream.m3u8')
    })

    it('should get streaming url successfully - flv', async () => {
      const url: URL = await apsara.getVideoStreamingUrl({
        domain: 'eko.com',
        appName: 'testApp',
        streamName: 'testStream',
        expiredIn: 3600,
        key: 'testKey',
        format: 'flv',
        isSecure: true
      })

      expect(url.protocol).toBe('https:')
      expect(url.host).toBe('eko.com')
      expect(url.pathname).toBe('/testApp/testStream.flv')
    })

    it('should get streaming url successfully - rtmp', async () => {
      const url: URL = await apsara.getVideoStreamingUrl({
        domain: 'eko.com',
        appName: 'testApp',
        streamName: 'testStream',
        expiredIn: 3600,
        key: 'testKey',
        format: 'rtmp',
        isSecure: true
      })

      expect(url.protocol).toBe('rtmp:')
      expect(url.host).toBe('eko.com')
      expect(url.pathname).toBe('/testApp/testStream')
    })
  })

  describe('Terminate ingest Url', () => {
    it('should fetch domains successfully', async () => {
      nock(BASE_URL)
        .get(() => true)
        .reply(200, {
          RequestId: '0500D05A-505D-49B1-B989-BDC9FDAB9BAD'
        })

      const res: ApsaraResponseData = await apsara.terminateStreamingUrl({
        domain: 'test',
        appName: 'test',
        streamName: 'test'
      })
      expect(res.RequestId).toBe('0500D05A-505D-49B1-B989-BDC9FDAB9BAD')
    })
  })
})
