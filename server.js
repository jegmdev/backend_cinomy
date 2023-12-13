const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

app.post('/api/registro', (req, res) => {
  const {
    correo,
    contraseña,
    nombre,
    apellidos,
    tipo,
    direccion,
    celular,
    documentoIdentidad
  } = req.body;

  const query = 'INSERT INTO cinema.usuarios (correo, contraseña, nombre, apellidos, tipo, direccion, celular, documentoIdentidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  db.query(query, [correo, contraseña, nombre, apellidos, tipo, direccion, celular, documentoIdentidad], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al agregar el registro' });
    } else {
      res.status(200).json({ message: 'Registro agregado correctamente' });
    }
  });
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

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Validar si el usuario está registrado
  const query = 'SELECT tipo FROM cinema.usuarios WHERE correo = ? AND contraseña = ?';

  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al realizar la autenticación' });
    } else {
      if (result.length > 0) {
        const userType = result[0].tipo;
        res.status(200).json({ message: 'Inicio de sesión exitoso', userType });
      } else {
        // Usuario no autenticado
        res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
      }
    }
  });
});