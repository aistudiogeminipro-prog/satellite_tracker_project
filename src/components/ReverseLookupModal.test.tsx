import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReverseLookupModal } from './ReverseLookupModal';

describe('ReverseLookupModal', () => {
  it('renders modal and executes search button', () => {
    const onClose = vi.fn();
    const onRestore = vi.fn();

    render(
      <ReverseLookupModal
        isOpen={true}
        onClose={onClose}
        satellites={[]}
        onRestoreScenario={onRestore}
      />
    );

    expect(screen.getByTestId('reverse-lookup-modal')).toBeInTheDocument();

    const searchBtn = screen.getByTestId('run-reverse-lookup-btn');
    fireEvent.click(searchBtn);

    expect(screen.getByTestId('lookup-results-area')).toBeInTheDocument();
  });
});
