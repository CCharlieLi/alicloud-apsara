export interface ApsaraDomainsData {
  Domains: PageData
  TotalCount: number
  RequestId: string
  PageSize: number
  PageNumber: number
}

interface PageData {
  PageData: Domain[]
}

interface Domain {
  Description: string
  LiveDomainStatus: string
  DomainName: string
  LiveDomainType: string
  RegionName: string
  GmtModified: string
  GmtCreated: string
  Cname: string
}
