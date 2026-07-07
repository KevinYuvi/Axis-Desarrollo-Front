import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OccupancyProvider } from './src/shared/context/OccupancyContext';
import { LoginScreen } from './src/modules/auth';
import { StudentHomeScreen, LibrariesScreen } from './src/modules/student';
import { AssistantScreen } from './src/modules/assistant';

function AppContent() {
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

export default function App() {
  return (
    <SafeAreaProvider>
      <OccupancyProvider>
        <AppContent />
      </OccupancyProvider>
    </SafeAreaProvider>
  );
}
