const express = require("express");
const { jsonResponse } = require("../lib/jsonResponse");
const { verifyRefreshToken } = require("../auth/verifyTokens");
const getUserInfo = require("../lib/getUserInfo");
const token = require("../schema/token");
const router = express.Router();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");

// Función para generar un token de acceso
function generateAccessToken(userInfo) {
  const accessToken = jwt.sign(userInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
  return accessToken;
}

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ju1000757812**",
  database: "cinema",
});

// Manejo de errores en la conexión a la base de datos
db.connect((err) => {
  try {
    if (err) {
      throw new Error("Error al conectar con la base de datos: " + err.message);
    }
    console.log("Connected to the database");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
});

// Manejo de errores en la consulta a la base de datos
function consultarToken(token) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM tokens WHERE token = ?";
    const params = [token];

    db.query(sql, params, (checkTokenError, checkTokenResults) => {
      try {
        if (checkTokenError) {
          throw new Error("Error al verificar la existencia del token: " + checkTokenError.message);
        }
        resolve(checkTokenResults);
      } catch (error) {
        console.error(error.message);
        reject(error);
      }
    });
  });
}

// Manejo de errores en la ruta "/"
router.post("/", async function (req, res) {
  try {
    const refreshToken = req.headers.authorization?.replace("Bearer ", "");

    if (!refreshToken) {
      console.log("No se proporcionó token de actualización", refreshToken);
      return res.status(401).json({ error: "Token de actualización no proporcionado" });
    }

    const results = await consultarToken(refreshToken);

    if (results && results[0] && results[0].token) {
      try {
        const payload = verifyRefreshToken(results[0].token);
        const userInfo = getUserInfo(payload.user);
        const accessToken = generateAccessToken(userInfo);
        console.log("Access Token:", accessToken );
        return res.json(jsonResponse(200, { accessToken }));
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          console.error("El token de actualización ha expirado:", error);
          return res.status(401).json({ error: "Token de actualización expirado. Vuelva a iniciar sesión." });
        } else {
          throw error;
        }
      }
    } else {
      console.log("El token no existe");
      return res.status(403).json({ error: "Token de actualización inválido" });
    }
  } catch (error) {
    console.error("Error general en la ruta /:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
