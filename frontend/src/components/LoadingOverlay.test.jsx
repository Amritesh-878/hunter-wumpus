import { render, screen } from '@testing-library/react';

import LoadingOverlay from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders the thinking message with loading-overlay class', () => {
    render(<LoadingOverlay />);

    expect(screen.getByRole('status')).toHaveClass('loading-overlay');
    expect(screen.getByText('The Wumpus is thinking...')).toBeInTheDocument();
  });
});