import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OccupancyProvider } from './src/shared/context/OccupancyContext';
import { LoginScreen } from './src/modules/auth';
import { StudentHomeScreen, LibrariesScreen } from './src/modules/student';
import { AssistantScreen } from './src/modules/assistant';
import { CameraTrackingScreen } from './src/modules/camera';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);

  /**
   * Navega a la pantalla de cámara en vivo para el espacio indicado.
   * @param {string} spaceId - Identificador del espacio a mostrar
   */
  function navigateToCamera(spaceId) {
    setSelectedSpaceId(spaceId);
    setCurrentScreen('cameraTracking');
  }

  if (currentScreen === 'studentHome' || currentScreen === 'home') {
    return <StudentHomeScreen onNavigate={setCurrentScreen} onNavigateToCamera={navigateToCamera} />;
  }

  if (currentScreen === 'libraries') {
    return <LibrariesScreen onNavigate={setCurrentScreen} onNavigateToCamera={navigateToCamera} />;
  }

  if (currentScreen === 'assistant') {
    return <AssistantScreen onNavigate={setCurrentScreen} />;
  }

  if (currentScreen === 'cameraTracking') {
    return <CameraTrackingScreen spaceId={selectedSpaceId} onNavigate={setCurrentScreen} />;
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
