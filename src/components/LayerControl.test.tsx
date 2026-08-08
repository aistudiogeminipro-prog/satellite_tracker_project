import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LayerControl } from './LayerControl';
import { BasemapType } from '../types/basemap';

describe('LayerControl', () => {
  it('renders control panel buttons', () => {
    const onBasemapChange = vi.fn();
    const onLightingToggle = vi.fn();
    const onOpenDataLoader = vi.fn();
    const onOpenReverseLookup = vi.fn();

    render(
      <LayerControl
        currentBasemap={BasemapType.ESRI_WORLD_IMAGERY}
        onBasemapChange={onBasemapChange}
        enableLighting={true}
        onLightingToggle={onLightingToggle}
        onOpenDataLoader={onOpenDataLoader}
        onOpenReverseLookup={onOpenReverseLookup}
        satelliteCount={5}
      />
    );

    const lookupBtn = screen.getByTestId('open-reverse-lookup-btn');
    fireEvent.click(lookupBtn);
    expect(onOpenReverseLookup).toHaveBeenCalled();
  });
});
