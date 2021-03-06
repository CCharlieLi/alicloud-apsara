# alicloud-apsara

[![Build Status](https://travis-ci.com/CCharlieLi/alicloud-apsara.svg?branch=master)](https://travis-ci.com/CCharlieLi/alicloud-apsara)
[![Coverage Status](https://coveralls.io/repos/github/CCharlieLi/alicloud-apsara/badge.svg?branch=master)](https://coveralls.io/github/CCharlieLi/alicloud-apsara?branch=master)

This is a library for integrating with AliCloud live-streaming platform - [Apsara](https://www.alibabacloud.com/help/doc-detail/29951.htm?spm=a2c63.p38356.b99.2.2c0d56a2C7EHql).

Integration progress:

- [x] [get domains](https://www.alibabacloud.com/help/doc-detail/88332.htm?spm=a2c63.p38356.b99.143.17872c80zDTOBs)
- [x] generate ingest/streaming url with signature
- [x] forbid ingest url
- [ ] TBD

### How to use

```js
import { Apsara, ApsaraDomainsData } from 'alicloud-apsara'

const apsara = new Apsara({
  accessKeyId: 'keyId',
  accessKeySecret: 'keySecret'
})

// fetch domains from apsara
const domainsData: ApsaraDomainsData = await apsara.getDomains()
// Domains: {
//   PageData: [
//     {
//       Description: '',
//       LiveDomainStatus: 'online',
//       DomainName: 'live-ingest.upstra-china.cc',
//       LiveDomainType: 'liveEdge',
//       RegionName: 'ap-southeast-1',
//       GmtModified: '2020-09-14T14:31:23Z',
//       GmtCreated: '2020-09-14T14:27:06Z',
//       Cname: 'live-ingest.upstra-china.cc.w.alikunlun.com'
//     }
//   ]
// },
// TotalCount: 8,
// RequestId: '0500D05A-505D-49B1-B989-BDC9FDAB9BAD',
// PageSize: 20,
// PageNumber: 1

// forbid a streaming
const res: ApsaraResponseData = await apsara.terminateStreamingUrl({
  domain: 'test',
  appName: 'test',
  streamName: 'test',
  oneshot: 'yes', // 'yes'/'no', yes - only forbid without adding to blacklist
  resumeTime: '2021-02-24T17:59:19Z'
})
// RequestId: '0500D05A-505D-49B1-B989-BDC9FDAB9BAD',
```

### Specs

#### Apsara(options [,logger])

- **options**, required
  - `accessKeyId`: string, required
  - `accessKeySecret`: string, required
  - `baseUrl`?: string, by default `'https://live.aliyuncs.com'`
  - `timeout`?: number, by default `3000`
  - `version`?: string, by default `'2016-11-01'`
  - `signatureMethod`?: string, by default `'HMAC-SHA1'`
  - `signatureVersion`?: string, by default `'1.0'`
  - `format`?: string, by default `'json'`
- **logger**, optional, WinstonLogger/BunyanLogger/Console

#### Methods (TBD)

- Apsara.getDomains()
- Apsara.getIngestUrl({
  domain: string
  appName: string
  streamName: string
  expiredIn: number
  key: string
  })
- Apsara.getVideoStreamingUrl({
  domain: string
  appName: string
  streamName: string
  expiredIn: number // seconds
  key: string
  format: string // 'rtmp' | 'flv' | 'm3u8' | 'udp'
  isSecure: boolean
  })
- Apsara.terminateStreamingUrl({
  domain: string
  appName: string
  streamName: string
  oneshot?: string
  resumeTime?: string // "yyyy-MM-dd'T'HH:mm:ss'Z'"
  })

### How to test

```sh
yarn
yarn test
```

### [MIT License](https://github.com/CCharlieLi/alicloud-apsara/blob/master/License)
