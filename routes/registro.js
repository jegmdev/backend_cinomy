const router = require("express").Router();
const { jsonResponse } = require("../lib/jsonResponse");
const User = require("../schema/user");

router.post("/", async (req, res) => {
  const { correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad } = req.body;

  try {
    // Verificar si el usuario ya existe
    const userExists = await User.usernameExists(correo);

    if (userExists) {
      return res.status(409).json(
        jsonResponse(409, {
          error: "User already exists",
        })
      );
    }

    // Crear un nuevo usuario
    const newUser = new User({
      correo,
      contraseña,
      nombre,
      apellidos,
      tipo,
      direccion,
      celular,
      documento_identidad,
    });

    // Guardar el nuevo usuario en la base de datos
    await newUser.save();

    res.status(200).json(
      jsonResponse(200, {
        message: "User created successfully",
      })
    );
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json(
      jsonResponse(500, {
        error: "Error creating user",
      })
    );
  }
});

module.exports = router;
