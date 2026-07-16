import ProfileRoleScreen from '../../../../shared/components/ProfileRoleScreen';

export default function EstudiantePerfilScreen() {
  return (
    <ProfileRoleScreen
      rolNombre="Estudiante"
      rolMetadata="estudiante"
      rolIcon="school-outline"
      rolColor="#2563EB"
      rolBg="#EFF6FF"
      backRoute="/(estudiante)"
    />
  );
}