import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth, hasConfig } from './firebase';

const FIREBASE_ERROR_MAP = {
  'auth/configuration-not-found':
    'Authentication service is not configured. Play without an account!',
  'auth/user-not-found': 'No account found with that ID. Try signing up!',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/invalid-credential': 'Invalid credentials. Check your ID and password.',
  'auth/email-already-in-use': 'This ID is already taken. Try a different one!',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

const UNRECOVERABLE_CODES = new Set([
  'auth/configuration-not-found',
  'auth/network-request-failed',
]);

function toFakeEmail(userId) {
  return `${userId}@hunterwumpus.local`;
}

function friendlyAuthError(err) {
  const code = err?.code ?? '';
  const message = FIREBASE_ERROR_MAP[code] ?? 'Something went wrong. Try again.';
  const friendly = new Error(message);
  friendly.code = code;
  return friendly;
}

export function isUnrecoverableAuthError(err) {
  return UNRECOVERABLE_CODES.has(err?.code ?? '');
}

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  authSkipped: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  skipAuth: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(hasConfig);
  const [authSkipped, setAuthSkipped] = useState(false);

  useEffect(() => {
    if (!hasConfig || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(userId, password) {
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        toFakeEmail(userId),
        password,
      );
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
    } catch (err) {
      throw friendlyAuthError(err);
    }
  }

  async function signup(userId, password) {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        toFakeEmail(userId),
        password,
      );
      const idToken = await cred.user.getIdToken();
      setToken(idToken);
    } catch (err) {
      throw friendlyAuthError(err);
    }
  }

  async function logoutUser() {
    await signOut(auth);
    setUser(null);
    setToken(null);
    setAuthSkipped(false);
  }

  function skipAuth() {
    setAuthSkipped(true);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      authSkipped,
      login,
      signup,
      logout: logoutUser,
      skipAuth,
    }),
    [user, token, loading, authSkipped],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
