const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("./auth/generateTokens");
const getUserInfo = require("./lib/getUserInfo");
const { jsonResponse } = require('./lib/jsonResponse');
const authenticate = require("./auth/authenticate");

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ju1000757812**',
  database: 'cinema',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

app.use('/api/refreshToken', require('./routes/refreshToken'));
app.use('/api/user', authenticate, require('./routes/user'));
app.use('/api/reservas', authenticate, require('./routes/reservas'));

app.post("/api/registro", async (req, res) => {
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


app.get('/api/registro', (_req, res) => {
  db.query('SELECT * FROM usuarios', (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los registros' });
    } else {
      res.status(200).json(result);
    }
  });
});

app.post('/api/estrenos', upload.single('promotionalImage'), (req, res) => {
  try {
    console.log('Entró en /api/estrenos');
    const {
      titulo,
      genero,
      sinopsis,
      promotionalImage,
      formato,
      duracion,
      valor_boleta
    } = req.body;

    // Asegúrate de que el archivo se haya cargado correctamente antes de acceder a sus propiedades
    if (req.file && req.file.filename) {
      const promotionalImage = req.file.filename;
      const rutaArchivo = req.file.path;

      // Resto del código...
      const query = 'INSERT INTO cinema.estrenos (titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta) VALUES (?, ?, ?, ?, ?, ?, ?)';

      db.query(query, [titulo, genero, sinopsis, promotionalImage, formato, duracion, valor_boleta], (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: 'Error al agregar la película' });
        } else {
          res.status(200).json({ message: 'Película agregada correctamente' });

          // Eliminar el archivo después de leer su contenido
          const imagenBinaria = fs.readFileSync(rutaArchivo);
          fs.unlinkSync(rutaArchivo);
        }
      });
    } else {
      res.status(400).json({ message: 'Archivo no encontrado o inválido' });
    }
  } catch (error) {
    console.error('Error al subir la información:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get('/api/estrenos', (_req, res) => {
  db.query('SELECT id, titulo, genero, sinopsis, imagen_promocional, formato, duracion, valor_boleta FROM cinema.estrenos', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los registros' });
    } else {
      // Iterar sobre los resultados y almacenar el tipo de usuario en una variable
      const usuariosConTipo = results.map((pelicula) => ({
        id_pelicula: pelicula.id,
        titulo: pelicula.titulo,
        genero: pelicula.genero,
        sinopsis: pelicula.sinopsis,
        imagen_promocional: pelicula.imagen_promocional,
        formato: pelicula.formato,
        duracion: pelicula.duracion,
        valor_boleta: pelicula.valor_boleta
      }));

      res.status(200).json(usuariosConTipo);
    }
  });
});

app.get('/api/registro/usuarios', (_req, res) => {
  db.query('SELECT id, correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad FROM cinema.usuarios', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener los registros' });
    } else {
      // Iterar sobre los resultados y almacenar el tipo de usuario en una variable
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

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Validar si el usuario está registrado
  const query = "SELECT * FROM cinema.usuarios WHERE correo = ?";

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
          const insertTokenQuery = "INSERT INTO cinema.tokens (token) VALUES (?)";
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

app.post('/api/reservar', async (req, res) => {
  const { idPelicula, pelicula, fecha, hora, sala, asientos, total } = req.body;

  const insertQuery = 'INSERT INTO cinema.reservas (peliculaId, pelicula, fecha, hora, sala, asientos, total) VALUES (?, ?, ?, ?, ?, ?, ?)';

  db.query(insertQuery, [idPelicula, pelicula, fecha, hora, sala, JSON.stringify(asientos), total], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al agregar la reserva' });
    } else {
      res.status(200).json({ message: 'Reserva agregada correctamente' });
    }
  });
});

app.get('/api/reservas', (req, res) => {
  const { idPelicula, fecha, hora, sala } = req.query;

  const query = 'SELECT * FROM cinema.reservas WHERE peliculaId = ? AND fecha = ? AND hora = ? AND sala = ?';

  db.query(query, [idPelicula, fecha, hora, sala], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener las reservas' });
    } else {
      res.status(200).json(result);
    }
  });
});

app.get('/api/listareservas', (req, res) => {
  const query = 'SELECT * FROM cinema.reservas';

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al obtener las reservas' });
    } else {
      res.status(200).json(results);
    }
  });
});
