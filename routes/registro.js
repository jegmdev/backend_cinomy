const router = require("express").Router();
const { jsonResponse } = require("../lib/jsonResponse");
const User = require("../schema/user");

router.post("/", async (req, res) => {
  const { correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad } = req.body;

  try {
    // Verificar si el usuario ya existe
    const checkUserQuery = "SELECT * FROM cinema.usuarios WHERE correo = ?";
    db.query(checkUserQuery, [correo], async (checkUserErr, checkUserResults) => {
      if (checkUserErr) {
        console.error("Error checking user existence:", checkUserErr);
        return res.status(500).json(
          jsonResponse(500, {
            error: "Error checking user existence",
          })
        );
      }

      if (checkUserResults.length > 0) {
        return res.status(409).json(
          jsonResponse(409, {
            error: "User already exists",
          })
        );
      }

      // Crear un nuevo usuario
      const hashedPassword = await bcrypt.hash(contraseña, 10);
      const insertUserQuery = "INSERT INTO usuarios (correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      db.query(
        insertUserQuery,
        [correo, hashedPassword, nombre, apellidos, tipo, direccion, celular, documento_identidad],
        (insertUserErr) => {
          if (insertUserErr) {
            console.error("Error creating user:", insertUserErr);
            return res.status(500).json(
              jsonResponse(500, {
                error: "Error creating user",
              })
            );
          }

          res.status(200).json(
            jsonResponse(200, {
              message: "User created successfully",
            })
          );
        }
      );
    });
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
