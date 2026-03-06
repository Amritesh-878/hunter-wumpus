import { useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import '../styles/Auth.css';

export default function Login() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignUp) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err?.message ?? 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className='login-panel' onSubmit={handleSubmit}>
      <h2 className='login-panel__title'>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
      <input
        className='login-panel__input'
        type='email'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete='email'
      />
      <input
        className='login-panel__input'
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
      />
      {error ? <p className='login-panel__error'>{error}</p> : null}
      <button className='login-panel__btn' type='submit' disabled={busy}>
        {busy ? 'Please wait…' : isSignUp ? 'Sign Up' : 'Sign In'}
      </button>
      <button
        className='login-panel__toggle'
        type='button'
        onClick={() => {
          setIsSignUp((v) => !v);
          setError('');
        }}
      >
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </button>
    </form>
  );
}
