import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataLoaderModal } from './DataLoaderModal';
import { DataSourceMode } from '../types/satellite';

describe('DataLoaderModal', () => {
  it('renders modal and triggers load callback', () => {
    const onClose = vi.fn();
    const onLoadData = vi.fn();

    render(<DataLoaderModal isOpen={true} onClose={onClose} onLoadData={onLoadData} />);

    expect(screen.getByTestId('data-loader-modal')).toBeInTheDocument();

    const uploadBtn = screen.getByTestId('mode-upload-btn');
    fireEvent.click(uploadBtn);

    const submitBtn = screen.getByTestId('submit-load-btn');
    fireEvent.click(submitBtn);

    expect(onLoadData).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: DataSourceMode.CUSTOM_UPLOAD,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});
