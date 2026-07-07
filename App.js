import { useState } from 'react';
import { LoginScreen } from './src/modules/auth';
import { StudentHomeScreen, LibrariesScreen } from './src/modules/student';
import { AssistantScreen } from './src/modules/assistant';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');

  if (currentScreen === 'studentHome' || currentScreen === 'home') {
    return <StudentHomeScreen onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === 'libraries') {
    return <LibrariesScreen onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === 'assistant') {
    return <AssistantScreen onNavigate={setCurrentScreen} />;
  }

  return <LoginScreen onDemoAccess={() => setCurrentScreen('studentHome')} />;
}
