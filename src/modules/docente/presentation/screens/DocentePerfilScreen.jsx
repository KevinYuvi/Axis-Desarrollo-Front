import ProfileRoleScreen from '../../../../shared/components/ProfileRoleScreen';

export default function DocentePerfilScreen() {
  return (
    <ProfileRoleScreen
      rolNombre="Docente"
      rolMetadata="docente"
      rolIcon="school-outline"
      rolColor="#16A34A"
      rolBg="#DCFCE7"
      backRoute="/(docente)"
    />
  );
}