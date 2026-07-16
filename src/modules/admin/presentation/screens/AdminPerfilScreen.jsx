import ProfileRoleScreen from '../../../../shared/components/ProfileRoleScreen';

export default function AdminPerfilScreen() {
  return (
    <ProfileRoleScreen
      rolNombre="Administrador"
      rolMetadata="admin"
      rolIcon="shield-checkmark-outline"
      rolColor="#9333EA"
      rolBg="#FDF4FF"
      backRoute="/(admin)"
    />
  );
}