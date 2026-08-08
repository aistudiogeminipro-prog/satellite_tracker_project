export enum SatelliteCategory {
  OPTICAL = 'OPTICAL',
  SAR = 'SAR',
  WEATHER = 'WEATHER',
  COMMUNICATION = 'COMMUNICATION',
  DEFENSE = 'DEFENSE',
  OTHER = 'OTHER',
}

export enum OrbitType {
  LEO = 'LEO (低軌道)',
  SSO = 'SSO (太陽同步軌道)',
  GEO = 'GEO (靜止軌道)',
  MEO = 'MEO (中軌道)',
  HEO = 'HEO (高橢圓軌道)',
}

export interface SatelliteMetadata {
  noradId: string;
  name: string;
  operator: string;
  country: string;
  category: SatelliteCategory;
  launchDate: string;
  resolution?: string;
  orbitType: OrbitType;
  launchVehicle: string;
  lifespanYears?: string;
  civilOrMilitary: '民用' | '軍用' | '軍民通用' | '未公開';
}

export interface SearchFilterState {
  keyword: string;
  categories: SatelliteCategory[];
  civilOrMilitary?: string;
}
