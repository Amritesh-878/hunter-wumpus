import { useState } from 'react';

import { isUnrecoverableAuthError, useAuth } from '../auth/AuthContext';
import '../styles/Auth.css';

export default function Login() {
  const { login, signup, skipAuth } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSkipPrompt, setShowSkipPrompt] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignUp) {
        await signup(userId, password);
      } else {
        await login(userId, password);
      }
    } catch (err) {
      if (err?.code === 'auth/configuration-not-found') {
        setError('Accounts are being set up \u2014 playing as guest');
        setTimeout(() => skipAuth(), 200);
        return;
      }
      setError(err?.message ?? 'Something went wrong. Try again.');
      if (isUnrecoverableAuthError(err)) {
        setShowSkipPrompt(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className='login-panel' onSubmit={handleSubmit}>
      <h2 className='login-panel__title'>
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      <input
        className='login-panel__input'
        type='text'
        placeholder='Player ID'
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        required
        autoComplete='username'
        maxLength={32}
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
      {showSkipPrompt ? (
        <button
          className='login-panel__btn login-panel__btn--skip'
          type='button'
          onClick={skipAuth}
        >
          Play Without Account
        </button>
      ) : (
        <button className='login-panel__btn' type='submit' disabled={busy}>
          {busy ? 'Please wait…' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      )}
      <button
        className='login-panel__toggle'
        type='button'
        onClick={() => {
          setIsSignUp((v) => !v);
          setError('');
        }}
      >
        {isSignUp
          ? 'Already have an account? Sign In'
          : "Don't have an account? Sign Up"}
      </button>
      <button
        className='login-panel__skip-link'
        type='button'
        onClick={skipAuth}
      >
        Skip — play without an account
      </button>
    </form>
  );
}
