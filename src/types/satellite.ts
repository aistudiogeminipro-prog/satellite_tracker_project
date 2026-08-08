export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  noradId: string;
}

export interface SatelliteRecord {
  noradId: string;
  name: string;
  tle: TLEData;
  category?: string;
  country?: string;
  operator?: string;
}

export enum DataSourceMode {
  SNAPSHOT = 'SNAPSHOT',
  CUSTOM_UPLOAD = 'CUSTOM_UPLOAD',
  SERVERLESS_PROXY = 'SERVERLESS_PROXY',
}

export interface FetchTLERequest {
  mode: DataSourceMode;
  fileContent?: string;
  serverlessUrl?: string;
  apiToken?: string;
}
