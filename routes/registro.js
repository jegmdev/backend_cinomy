const router = require("express").Router();
const { jsonResponse } = require("../lib/jsonResponse");

router.post("/", (req, res) => {
  const { correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad } = req.body;
  res.send('Registro')
});

module.exports = router;
