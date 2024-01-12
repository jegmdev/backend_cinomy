function getUserInfo(user) {
  return {
    email: user.correo || "", 
    nombre: user.nombre || "",
    apellidos: user.apellidos || "",
    tipo: user.tipo || "",
    direccion: user.direccion || "",
    celular: user.celular || "",
    documentoIdentidad: user.documento_identidad || "",
  };
}

module.exports = getUserInfo;
