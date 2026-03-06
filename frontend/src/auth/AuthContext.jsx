import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from './firebase';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
  }

  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
  }

  async function logoutUser() {
    await signOut(auth);
    setUser(null);
    setToken(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout: logoutUser }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
