function getUserInfo(user) {
  if (!user) {
    return null; // O un objeto vacío, dependiendo de tus necesidades
  }

  return {
    email: user.correo || "", // Ajusta si es necesario
    nombre: user.nombre || "",
    apellidos: user.apellidos || "",
    tipo: user.tipo || "",
    direccion: user.direccion || "",
    celular: user.celular || "",
    documentoIdentidad: user.documentoIdentidad || "",
  };
}

module.exports = getUserInfo;
