const express = require("express");
const { jsonResponse } = require("../lib/jsonResponse");
const { verifyRefreshToken } = require("../auth/verifyTokens");
const getUserInfo = require("../lib/getUserInfo");
const Token = require("../schema/token");
const router = express.Router();
const mysql = require("mysql");
const jwt = require("jsonwebtoken"); // Importa la biblioteca jsonwebtoken

const SECRET_KEY = "tu_clave_secreta"; // Cambia esto con tu clave secreta

// Función para generar un token de acceso
function generateAccessToken(userInfo) {
  // Utiliza la información del usuario (userInfo) para incluir los datos necesarios en el token
  // Puedes ajustar los datos que se incluyen según tus necesidades
  const accessToken = jwt.sign(userInfo, SECRET_KEY, { expiresIn: "1h" }); // Token expira en 1 hora
  return accessToken;
}

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ju1000757812**",
  database: "cinema",
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err);
    process.exit(1);
  }
  console.log("Connected to the database");
});

function consultarToken(token) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM tokens WHERE token = ?";
    const params = [token];

    db.query(sql, params, (checkTokenError, checkTokenResults) => {
      if (checkTokenError) {
        console.error("Error al verificar la existencia del token:", checkTokenError);
        reject(checkTokenError);
      } else {
        resolve(checkTokenResults);
      }
    });
  });
}

router.post("/", async function (req, res) {
  const refreshToken = req.headers.authorization?.replace("Bearer ", "");

  try {
    if (!refreshToken) {
      console.log("No se proporcionó token de actualización", refreshToken);
      return res.status(401).json({ error: "Token de actualización no proporcionado" });
    }

    const results = await consultarToken(refreshToken);

    if (results.length > 0) {
      const payload = verifyRefreshToken(results[0].token);
      const userInfo = getUserInfo(payload.user);
      const accessToken = generateAccessToken(userInfo);
      console.log("TokenDoument:", results[0].token);
      return res.json(jsonResponse(200, { accessToken }));
    } else {
      console.log("El token no existe");
      return res.status(403).json({ error: "Token de actualización inválido" });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.error("El token de actualización ha expirado:", error);
      return res.status(401).json({ error: "Token de actualización expirado" });
    } else {
      console.error("Error al consultar el token:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }
});

module.exports = router;
