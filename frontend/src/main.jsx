import ReactDOM from 'react-dom/client';

import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { GameProvider } from './store/GameContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <GameProvider>
      <App />
    </GameProvider>
  </AuthProvider>,
);
