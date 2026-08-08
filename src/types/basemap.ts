export enum BasemapType {
  ESRI_WORLD_IMAGERY = 'ESRI_WORLD_IMAGERY',
  OPEN_STREET_MAP = 'OPEN_STREET_MAP',
}

export interface BasemapOption {
  id: BasemapType;
  name: string;
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  { id: BasemapType.ESRI_WORLD_IMAGERY, name: 'ESRI World Imagery' },
  { id: BasemapType.OPEN_STREET_MAP, name: 'OpenStreetMap' },
];
