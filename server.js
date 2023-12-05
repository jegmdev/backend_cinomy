const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // Permitir solicitudes solo desde este origen
  credentials: true, // Habilitar el envío de cookies de autenticación
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la base de datos
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

  const query = 'INSERT INTO cinema.usuarios (correo, contraseña, nombre, apellidos, tipo, direccion, celular, documento_identidad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

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

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
     // Validar si el usuario está registrado
    const query = 'SELECT * FROM cinema.usuarios WHERE correo = ? AND contraseña = ?';
  
    db.query(query, [email, password], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al realizar la autenticación' });
      } 
      else {
        if (result.length > 0) {
          // Usuario autenticado
          res.status(200).json({ message: 'Inicio de sesión exitoso' });
        } else {
          // Usuario no autenticado
          res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
        }
      }
    });
  });