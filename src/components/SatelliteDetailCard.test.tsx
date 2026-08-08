import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SatelliteDetailCard } from './SatelliteDetailCard';
import { SatelliteCategory, OrbitType, SatelliteMetadata } from '../types/metadata';

describe('SatelliteDetailCard', () => {
  const sampleMeta: SatelliteMetadata = {
    noradId: '39634',
    name: 'SENTINEL-1A',
    operator: 'ESA',
    country: '歐盟',
    category: SatelliteCategory.SAR,
    launchDate: '2014-04-03',
    resolution: '5m SAR',
    orbitType: OrbitType.SSO,
    launchVehicle: 'Soyuz',
    lifespanYears: '7年',
    civilOrMilitary: '民用',
  };

  it('renders metadata correctly and triggers onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SatelliteDetailCard metadata={sampleMeta} onClose={onClose} />);

    expect(screen.getByTestId('satellite-detail-card')).toBeInTheDocument();
    expect(screen.getByText('SENTINEL-1A')).toBeInTheDocument();
    expect(screen.getByText('ESA')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-detail-card-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
