import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockSkipAuth = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
    skipAuth: mockSkipAuth,
  }),
  isUnrecoverableAuthError: (err) => {
    const code = err?.code ?? '';
    return (
      code === 'auth/configuration-not-found' ||
      code === 'auth/network-request-failed'
    );
  },
}));

import Login from './Login';

describe('Login component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Player ID and Password fields', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText('Player ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('uses text input for Player ID, not email', () => {
    render(<Login />);

    const playerIdInput = screen.getByPlaceholderText('Player ID');
    expect(playerIdInput).toHaveAttribute('type', 'text');
  });

  it('calls login with userId and password on sign-in submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'player123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('player123', 'secret');
    });
  });

  it('calls signup with userId and password on sign-up submit', async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    render(<Login />);

    fireEvent.click(
      screen.getByRole('button', { name: /Sign Up/i }),
    );
    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'newplayer' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'abc123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('newplayer', 'abc123');
    });
  });

  it('shows friendly error message on login failure', async () => {
    const err = new Error('Invalid credentials. Check your ID and password.');
    err.code = 'auth/invalid-credential';
    mockLogin.mockRejectedValueOnce(err);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'player1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(
        screen.getByText('Invalid credentials. Check your ID and password.'),
      ).toBeInTheDocument();
    });
  });

  it('auto-skips auth on configuration-not-found error', async () => {
    vi.useFakeTimers();
    const err = new Error(
      'Authentication service is not configured. Play without an account!',
    );
    err.code = 'auth/configuration-not-found';
    mockLogin.mockRejectedValueOnce(err);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'player1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      await Promise.resolve();
    });

    expect(
      screen.getByText('Accounts are being set up \u2014 playing as guest'),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockSkipAuth).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('calls skipAuth when Play Without Account is clicked', async () => {
    const err = new Error('Network error. Check your connection.');
    err.code = 'auth/network-request-failed';
    mockLogin.mockRejectedValueOnce(err);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'player1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Play Without Account' }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Play Without Account' }),
    );
    expect(mockSkipAuth).toHaveBeenCalledTimes(1);
  });

  it('always shows skip link at the bottom', () => {
    render(<Login />);

    const skipLink = screen.getByRole('button', {
      name: /play without an account/i,
    });
    expect(skipLink).toBeInTheDocument();
  });

  it('calls skipAuth when skip link is clicked', () => {
    render(<Login />);

    fireEvent.click(
      screen.getByRole('button', { name: /play without an account/i }),
    );
    expect(mockSkipAuth).toHaveBeenCalledTimes(1);
  });

  it('toggles between Sign In and Sign Up modes', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Sign Up/i }),
    );

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('clears error when toggling sign-in/sign-up mode', async () => {
    const err = new Error('Incorrect password. Try again.');
    err.code = 'auth/wrong-password';
    mockLogin.mockRejectedValueOnce(err);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'player1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(
        screen.getByText('Incorrect password. Try again.'),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Sign Up/i }),
    );

    expect(
      screen.queryByText('Incorrect password. Try again.'),
    ).not.toBeInTheDocument();
  });

  it('does not expose raw Firebase error codes in the UI', async () => {
    const err = new Error('Something went wrong. Try again.');
    err.code = 'auth/unknown-error-xyz';
    mockLogin.mockRejectedValueOnce(err);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Player ID'), {
      target: { value: 'player1' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Try again.'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/auth\//)).not.toBeInTheDocument();
  });
});
