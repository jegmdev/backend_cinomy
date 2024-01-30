const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../auth/generateTokens");
const getUserInfo = require("../lib/getUserInfo");
const Token = require("../schema/token");

const UserSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  nombre: { type: String, required: true },
  apellidos: { type: String, required: true },
  tipo: { type: Number, required: true },
  direccion: { type: String, required: true },
  celular: { type: Number, required: true },
  documento_identidad: { type: String, required: true },
});

UserSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      const hash = await bcrypt.hash(this.password, 10);
      this.password = hash;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

UserSchema.methods.comparePassword = async function (password) {
  const same = await bcrypt.compare(password, this.password);
  return same;
};

UserSchema.methods.createAccessToken = function () {
  return generateAccessToken(getUserInfo(this));
};

UserSchema.methods.createRefreshToken = async function () {
  const refreshToken = generateRefreshToken(getUserInfo(this));
  try {
    await new Token({ token: refreshToken }).save();
    return refreshToken;
  } catch (err) {
    console.error("Error al guardar token de refresco:", err);
    throw err;
  }
};

module.exports = mongoose.model("User", UserSchema);