import { useState } from 'react';
import { LoginScreen } from './src/modules/auth';
import { StudentHomeScreen, LibrariesScreen } from './src/modules/student';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  if (currentScreen === 'studentHome') {
    return <StudentHomeScreen onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === 'libraries') {
    return <LibrariesScreen onNavigate={setCurrentScreen} />;
  }

  return <LoginScreen onDemoAccess={() => setCurrentScreen('studentHome')} />;
}
