import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CesiumViewer } from './CesiumViewer';
import { BasemapType } from '../types/basemap';

vi.mock('cesium', () => ({
  Viewer: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    scene: {
      globe: { enableLighting: true },
      canvas: {},
      pick: vi.fn(),
    },
    camera: {
      flyTo: vi.fn(),
    },
    imageryLayers: {
      removeAll: vi.fn(),
      addImageryProvider: vi.fn(),
    },
    dataSources: {
      add: vi.fn(),
    },
    clock: {
      shouldAnimate: true,
      currentTime: {},
      onTick: {
        addEventListener: vi.fn().mockReturnValue(() => {}),
      },
    },
  })),
  CustomDataSource: vi.fn().mockImplementation(() => ({
    entities: {
      removeAll: vi.fn(),
      add: vi.fn(),
      getById: vi.fn(),
    },
  })),
  ScreenSpaceEventHandler: vi.fn().mockImplementation(() => ({
    setInputAction: vi.fn(),
    destroy: vi.fn(),
  })),
  ScreenSpaceEventType: {
    LEFT_CLICK: 'LEFT_CLICK',
  },
  OpenStreetMapImageryProvider: vi.fn(),
  UrlTemplateImageryProvider: vi.fn(),
  JulianDate: {
    toDate: vi.fn().mockReturnValue(new Date()),
    fromDate: vi.fn(),
  },
  Cartesian3: {
    fromDegrees: vi.fn(),
  },
  Color: {
    CYAN: { withAlpha: vi.fn() },
    YELLOW: { withAlpha: vi.fn() },
    WHITE: 'WHITE',
    BLACK: 'BLACK',
  },
  Cartesian2: vi.fn(),
  ConstantPositionProperty: vi.fn(),
  LabelStyle: {
    FILL_AND_OUTLINE: 'FILL_AND_OUTLINE',
  },
  defined: vi.fn().mockReturnValue(false),
}));

describe('CesiumViewer', () => {
  it('renders the globe container element with scenario restoration prop', () => {
    render(
      <CesiumViewer
        selectedBasemap={BasemapType.ESRI_WORLD_IMAGERY}
        enableLighting={true}
        satellites={[]}
        selectedNoradId={null}
        restoredScenario={{
          timestamp: new Date('2024-05-10T14:00:00Z'),
          targetLat: 25.03,
          targetLon: 121.56,
        }}
      />
    );
    const container = screen.getByTestId('cesium-container');
    expect(container).toBeInTheDocument();
  });
});
