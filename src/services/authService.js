// src/services/authService.js

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const iniciarSesionAPI = async (email, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    // 🔑 CORRECCIÓN DE LA RUTA AQUÍ: Agregamos /api/v1
    const response = await fetch(`${API_URL}/api/v1/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en las credenciales');
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Error en login service:", error);
    throw error;
  }
};