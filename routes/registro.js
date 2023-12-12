const router = require("express").Router();

router.post("/", (req, res) => {
  // Validaciones básicas
  if (
    !correo ||
    !contraseña ||
    !nombre ||
    !apellidos ||
    !tipo ||
    !direccion ||
    !celular ||
    !documentoIdentidad 
  ) {
    return res.status(400).json(jsonResponse(400, {
        error: 'Complete los campos'
    }));
  }

  res.status(200).json(jsonResponse(200, {message: 'Usuario creado'}))

  res.send("Registro");
});

module.exports = router;
