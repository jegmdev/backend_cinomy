const express = require("express");
const { jsonResponse } = require("../lib/jsonResponse");
const { verifyRefreshToken } = require("../auth/verifyTokens");
const getUserInfo = require("../lib/getUserInfo");
const Token = require("../schema/token");
const router = express.Router();
const mysql = require("mysql");

router.post("/", async function (req, res, next) {
  const refreshToken = req.headers.authorization.replace("Bearer ", "");

  if (refreshToken) {
    let tokenDocument = "";
    consultarToken(refreshToken, (err, results) => {
      if (err) {
        console.error("Error al consultar el token:", err);
        return;
      }
      tokenDocument = results[0].token;
    });

    if (tokenDocument) {
      console.log("TokenDoument:", tokenDocument);
      const payload = verifyRefreshToken(tokenDocument.token);
      const accessToken = generateAccessToken(getUserInfo(payload.user));
      res.json(jsonResponse(200, { accessToken }));
    } else {
      return res.status(403).json({ error: "Token de actualización inválido" });
    }
    console.log("Se proporcionó token de actualización", refreshToken);
    return res
      .status(200)
      .json({ message: "Token de actualización proporcionado", refreshToken });
  } else {
    console.log("No se proporcionó token de actualización", refreshToken);
    return res
      .status(401)
      .json({ error: "Token de actualización no proporcionado" });
  }
});

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ju1000757812**",
  database: "cinema",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database");
});

function consultarToken(token, callback) {
  // Consulta SQL
  const sql = "SELECT * FROM tokens WHERE token = ?";

  // Parámetros para la consulta
  const params = [token];

  // Ejecutar la consulta
  db.query(sql, params, (checkTokenError, checkTokenResults) => {
    if (checkTokenError) {
      console.error(
        "Error al verificar la existencia del token:",
        checkTokenError
      );
      return callback(checkTokenError, null);
    }

    if (checkTokenResults.length > 0) {
      console.log("El token existe:", token);
      // Si quieres devolver el token encontrado, puedes hacerlo aquí
      // return callback(null, checkTokenResults[0]);
    } else {
      console.log("El token no existe");
      // Si deseas devolver null cuando el token no existe
      // return callback(null, null);
    }

    // Aquí puedes devolver otros resultados si es necesario
    return callback(null, checkTokenResults);
  });
}

module.exports = router;
