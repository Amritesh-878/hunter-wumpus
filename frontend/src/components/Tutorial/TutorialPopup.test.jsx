import { fireEvent, render, screen } from '@testing-library/react';

import TutorialPopup from './TutorialPopup';
import stenchIcon from '../../assets/stench.svg';

describe('TutorialPopup', () => {
  it('renders title/body and uses default dismiss label', () => {
    const onDismiss = vi.fn();

    const { container } = render(
      <TutorialPopup
        title='The Hunt Begins'
        body='Tutorial body copy.'
        onDismiss={onDismiss}
        icon={stenchIcon}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('The Hunt Begins')).toBeInTheDocument();
    expect(screen.getByText('Tutorial body copy.')).toBeInTheDocument();
    expect(container.querySelector('.tutorial-popup__box')).toBeInTheDocument();
    expect(container.querySelector('.tutorial-popup__icon')).toHaveAttribute(
      'src',
      stenchIcon,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Got it →' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders a custom dismiss label', () => {
    const onDismiss = vi.fn();

    render(
      <TutorialPopup
        title='You Survived'
        body='Completion text.'
        dismissLabel='Start Real Game →'
        onDismiss={onDismiss}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Start Real Game →' }),
    ).toBeInTheDocument();
  });
});