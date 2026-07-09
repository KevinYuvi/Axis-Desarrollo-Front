import { useRouter } from 'expo-router';
import LibrariesScreen from '../../src/modules/student/presentation/screens/LibrariesScreen';

const TAB_ROUTES = {
  home: '/(dashboard)',
  libraries: '/(dashboard)/bibliotecas',
  assistant: '/(dashboard)/asistente',
};

export default function LibrariesRoute() {
  const router = useRouter();
  return (
    <LibrariesScreen
      onNavigate={(tab) => router.push(TAB_ROUTES[tab] ?? '/(dashboard)')}
      onNavigateToCamera={(spaceId) =>
        router.push({ pathname: '/(dashboard)/camara', params: { spaceId } })
      }
    />
  );
}
