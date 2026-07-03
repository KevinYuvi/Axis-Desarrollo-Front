import { useState } from 'react';
import { LoginScreen } from './src/modules/auth';
import { StudentHomeScreen } from './src/modules/student';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  if (currentScreen === 'studentHome') {
    return <StudentHomeScreen onLogout={() => setCurrentScreen('login')} />;
  }

  return <LoginScreen onDemoAccess={() => setCurrentScreen('studentHome')} />;
}
