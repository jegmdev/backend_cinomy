const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("./auth/generateTokens");
const getUserInfo = require("./lib/getUserInfo");
const { jsonResponse } = require('./lib/jsonResponse');

const app = express();

const allowedOrigins = ['https://trescoders.online', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.DATABASE,
  connectTimeout: 3600000, // Tiempo de espera en milisegundos (3600 segundos)
});

// Manejador de errores para la conexión a la base de datos
db.on('error', (err) => {
  console.error('Error en la conexión a la base de datos:', err);
});

// Lógica para conectar la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err; // Terminar la aplicación si no se puede conectar a la base de datos
  }
  console.log('Conexión establecida con la base de datos');
});

app.listen(3001, () => {
  console.log('Server is running');
});

app.post("/api/registro", async (req, res) => {
  try {
    const { correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad } = req.body;

    const checkUserQuery = "SELECT * FROM " + process.env.DATABASE + ".usuarios WHERE correo = ?";
    db.query(checkUserQuery, [correo], async (checkUserErr, checkUserResults) => {
      if (checkUserErr) {
        console.error("Error al verificar la existencia del usuario:", checkUserErr);
        return res.status(500).json({
          error: "Error al verificar la existencia del usuario",
        });
      }

      if (checkUserResults.length > 0) {
        return res.status(409).json({
          error: "El usuario ya existe",
        });
      }

      const hashedPassword = await bcrypt.hash(contraseña, 10);
      const insertUserQuery = "INSERT INTO " + process.env.DATABASE + ".usuarios (correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      db.query(insertUserQuery, [correo, hashedPassword, nombre, apellidos, tipo, direccion, celular, documento_identidad], (insertUserErr) => {
        if (insertUserErr) {
          console.error("Error al crear el usuario:", insertUserErr);
          return res.status(500).json({
            error: "Error al crear el usuario",
          });
        }

        res.status(200).json({
          message: "Usuario creado exitosamente",
        });
      });
    });
  } catch (err) {
    console.error("Error al crear el usuario:", err);
    return res.status(500).json({
      error: "Error al crear el usuario",
    });
  }
});

// Endpoint para obtener todos los registros de usuarios
app.get('/api/registro', (_req, res) => {
  db.query("SELECT * FROM " + process.env.DATABASE + ".usuarios", (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los registros' });
    } else {
      res.status(200).json(result);
    }
  });
});

// Endpoint para agregar estrenos
app.post("/api/estrenos", async (req, res) => {
  try {
    const { titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta } = req.body;
    const query = "INSERT INTO " + process.env.DATABASE + ".estrenos (titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.query(query, [titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta], (err, results) => {
      if (err) {
        console.error("Error al insertar película:", err);
        res.status(500).json({ message: "Error interno del servidor" });
      } else {
        res.status(200).json({ message: "Película agregada correctamente" });
      }
    });
  } catch (err) {
    console.error("Error al insertar película:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Endpoint para obtener detalles de una película
app.get('/api/estrenos/:id', (req, res) => {
  const peliculaId = req.params.id;
  const query = "SELECT * FROM " + process.env.DATABASE + ".estrenos WHERE id = ?";

  db.query(query, [peliculaId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los detalles de la película' });
    } else {
      if (results.length > 0) {
        const pelicula = results[0];
        const movieDetails = {
          id: pelicula.id,
          titulo: pelicula.titulo,
          genero: pelicula.genero,
          sinopsis: pelicula.sinopsis,
          imagen_promocional: pelicula.imagen_promocional,
          formato: pelicula.formato,
          duracion: pelicula.duracion,
          valor_boleta: pelicula.valor_boleta,
        };
        res.status(200).json(movieDetails);
      } else {
        res.status(404).json({ message: 'No se encontró la película con el ID proporcionado' });
      }
    }
  });
});

// Endpoint para eliminar reservas
app.delete('/api/reservas/:id', (req, res) => {
  const reservaId = req.params.id;
  const deleteQuery = "DELETE FROM " + process.env.DATABASE + ".reservas WHERE id = ?";

  db.query(deleteQuery, [reservaId], (err, result) => {
    if (err) {
      console.error('Error al eliminar la reserva:', err);
      res.status(500).json({ message: 'Error interno del servidor' });
    } else {
      if (result.affectedRows > 0) {
        res.status(200).json({ message: 'Reserva eliminada correctamente' });
      } else {
        res.status(404).json({ message: 'Reserva no encontrada' });
      }
    }
  });
});

// Endpoint para eliminar sillas de una reserva
app.put('/api/reservas/:id/eliminar-sillas', (req, res) => {
  const reservaId = req.params.id;
  const { sillasAEliminar } = req.body;

  // Verificar que sillasAEliminar es un array válido antes de procesarlo
  if (!Array.isArray(sillasAEliminar) || sillasAEliminar.length === 0) {
    return res.status(400).json({ message: 'La solicitud debe incluir un array válido de sillas a eliminar' });
  }

  const getReservaQuery = "SELECT asientos FROM " + process.env.DATABASE + ".reservas WHERE id = ?";

  db.query(getReservaQuery, [reservaId], (err, result) => {
    if (err) {
      console.error('Error al obtener la reserva:', err);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const reserva = result[0];
    const asientosActuales = JSON.parse(reserva.asientos);

    const nuevosAsientos = asientosActuales.filter((asiento) => !sillasAEliminar.includes(asiento));

    const updateQuery = "UPDATE " + process.env.DATABASE + ".reservas SET asientos = ? WHERE id = ?";

    db.query(updateQuery, [JSON.stringify(nuevosAsientos), reservaId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error('Error al actualizar la reserva con nuevas sillas:', updateErr);
        res.status(500).json({ message: 'Error interno del servidor' });
      } else {
        if (updateResult.affectedRows > 0) {
          res.status(200).json({ message: 'Sillas eliminadas de la reserva correctamente' });
        } else {
          res.status(404).json({ message: 'Reserva no encontrada' });
        }
      }
    });
  });
});

// Endpoint para obtener todos los estrenos
app.get('/api/estrenos', (_req, res) => {
  const query = "SELECT id, titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta FROM " + process.env.DATABASE + ".estrenos";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los registros de películas' });
    } else {
      const movies = results.map((pelicula) => ({
        id: pelicula.id,
        titulo: pelicula.titulo,
        genero: pelicula.genero,
        sinopsis: pelicula.sinopsis,
        imagen_promocional: pelicula.imagen_promocional,
        formato: pelicula.formato,
        duracion: pelicula.duracion,
        valor_boleta: pelicula.valor_boleta,
      }));

      res.status(200).json(movies);
    }
  });
});

// Endpoint para editar un estreno
app.put('/api/estrenos/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta } = req.body;

  const updateQuery = `
    UPDATE  " + process.env.DATABASE + ".estrenos
    SET
      titulo = ?,
      genero = ?,
      sinopsis = ?,
      imagen_promocional = ?,
      formato = ?,
      duracion = ?,
      valor_boleta = ?
    WHERE id = ?`;

  const values = [
    titulo,
    genero,
    sinopsis,
    imagen_promocional,
    formato,
    duracion,
    valor_boleta,
    id,
  ];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al editar la película' });
    } else {
      res.status(200).json({ message: 'Película editada correctamente' });
    }
  });
});

// Endpoint para obtener todos los usuarios registrados
app.get('/api/registro/usuarios', (_req, res) => {
  const query = "SELECT id, correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad FROM " + process.env.DATABASE + ".usuarios";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los registros' });
    } else {
      const usuariosConTipo = results.map((usuario) => ({
        id_usuario: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        tipo: usuario.tipo,
        direccion: usuario.direccion,
        celular: usuario.celular,
        documento_identidad: usuario.documento_identidad
      }));

      res.status(200).json(usuariosConTipo);
    }
  });
});

// Endpoint para realizar inicio de sesión
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Validar si el usuario está registrado
  const query = "SELECT * FROM " + process.env.DATABASE + ".usuarios WHERE correo = ?";

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error al realizar la autenticación:", err);
      res.status(500).json({ message: "Error al realizar la autenticación" });
    } else {
      if (results.length > 0) {
        const user = results[0];

        // Comparar la contraseña proporcionada con la almacenada en la base de datos
        const passwordCorrect = await bcrypt.compare(password, user.contraseña);

        if (passwordCorrect) {
          const accessToken = generateAccessToken(getUserInfo(user));
          const refreshToken = await generateRefreshToken(getUserInfo(user));

          // Guardar el token de actualización en la base de datos
          const insertTokenQuery = "INSERT INTO " + process.env.DATABASE + ".tokens (token) VALUES (?)";
          db.query(insertTokenQuery, [refreshToken], (tokenErr) => {
            if (tokenErr) {
              console.error("Error al guardar el token de refresco:", tokenErr);
              res.status(500).json({ message: "Error interno del servidor" });
            } else {
              res.status(200).json({
                message: "Inicio de sesión exitoso",
                accessToken,
                refreshToken,
                user: getUserInfo(user),
              });
            }
          });
        } else {
          // Contraseña incorrecta
          res.status(401).json({ message: "Correo electrónico o contraseña incorrectos" });
        }
      } else {
        // Usuario no autenticado
        res.status(401).json({ message: "Correo electrónico o contraseña incorrectos" });
      }
    }
  });
});

// Endpoint para agregar una reserva
app.post('/api/reservar', async (req, res) => {
  const { usuarioId, idPelicula, pelicula, fecha, hora, sala, asientos, total } = req.body;

  const insertQuery = "INSERT INTO " + process.env.DATABASE + ".reservas (usuarioId, peliculaId, pelicula, fecha, hora, sala, asientos, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(insertQuery, [usuarioId, idPelicula, pelicula, fecha, hora, sala, JSON.stringify(asientos), total], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al agregar la reserva' });
    } else {
      res.status(200).json({ message: 'Reserva agregada correctamente' });
    }
  });
});

// Endpoint para obtener reservas
app.get('/api/reservas', (req, res) => {
  const { idPelicula, fecha, hora, sala } = req.query;

  const query = "SELECT * FROM " + process.env.DATABASE + ".reservas WHERE peliculaId = ? AND fecha = ? AND hora = ? AND sala = ?";

  db.query(query, [idPelicula, fecha, hora, sala], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener las reservas' });
    } else {
      res.status(200).json(result);
    }
  });
});

// Endpoint para obtener todas las reservas
app.get('/api/listareservas', (req, res) => {
  const query = "SELECT * FROM " + process.env.DATABASE + ".reservas";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener las reservas' });
    } else {
      res.status(200).json(results);
    }
  });
});
