const mysql = require ("mysql");
const cors = require ("cors");
const express = require ("express");
const bodyParser = require ("body-parser");
const bcrypt = require ("bcryptj");
const crypto= require ("crypto");

const PORT = process.env.PORT || 3014;
const app = express();
app.use (cors());
app.use (bodyParser.json());

const db = mysql.createConnection({
host : process.env.DB_HOST,
user : process.env.DB_USER,
password : process.env.DB_PASSWORD,
database : process.env.DB_NAME
});


db.connect((err)=>{
if (err){
console.log("Error en la conexion a la base de datos")
return 
}
console.log("Conectado a la base de datos")
});

exports.CrearUsuario =(req,res)=>{
const {nombre,apellido,correo,contraseña,rol}=req.body;
if (!nombre || !apellido || !correo ||!contraseña){
return res.status(400).json("Todos los datos son requeridos")
}
if (contraseña.length <6){
return res.status(400).json("La contraseña debe de tener minimo 6 caracteres")
}
db.query("SELECT * FROM usuarios WHERE correo=?",
[correo],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error en el servidor")
}
if (result.length >0){
return res.status(400).json("El correo ya existe en el sistema")
}
try{
const hashedPassword = await bcrypt.hash(contraseña,10)
const Rol = rol || 2
const estado = "activo"
db.query("INSERT INTO usuarios (nombre,apellido,correo,contraseña,rol,estado)VALUES(?,?,?,?,?,?)",
[nombre,apellido,correo,hashedPassword,rol,estado],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Usuario no registrado")
}
res.send(result)
})}
catch(err){
console.log("Usuario no registrado")
}})};



exports.LoginUsuario =(req,res)=>{
const {correo,contraseña}=req.body;
if (!correo || !contraseña){
return res.status(400).json("Los datos son requeridos")
}
db.query("SELECT * FROM usuarios WHERE correo=?",
[correo],
async(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error en el servidor")
}
if(result.length ===0){
return res.status(400).json("El correo no existe en el sistema")
}
const usuario = result [0];
if (usuario.estado ==="inactivo"){
return res.status(400).json("Usuario incativo, Contacte al administrador")
}
const ConfirmarContraseña = await bcrypt.compare(
contraseña,
usuario.contraseña
);
if (!ConfirmarContraseña){
return res.status(400).json("Contraseña incorrecta")
}
const Token = jwt.sign({
id : usuario.id,
rol : usuario.rol,
}, process.env.JWT_SECRET,
{expiresIn : "1h"}
)
res.status(200).json({
mensaje : "Ingreso Exitoso",
ususario :{
id : usuario.id,
nombre : usuario.nombre,
apelllido : usuario.apellido,
correo : usuario.correo,
rol : usuario.rol,
estado : usuario.estado,
foto : usuario.foto,
telefono : usuario.telefono
}})})};



exports.CrearCliente =(req,res)=>{
const {nombre,apellido,documento,direccion,genero,email,tipo_documento}
db.query("INSERT INTO clientes (nombre,apellido,documento,direccion,genero,email,tipo_documento) VALUES(?,?,?,?,?,?,?)",
[nombre,apellido,documento,direccion,genero,email,tipo_documento],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al crear el cliente")
}
res.send(result)
})};


exports.RecuperarPassword =(req,res)=>{
const {correo}=req.body;
if (!correo){
return res.status(400).json("El campo es obligatorio")
}
db.query("SELECT * FROM usuarios WHERE correo=?",
[correo],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error en el servidor")
}
if (result.length ===0){
return res.status(400).json("El correo no existe en el sistema")
}
const Token = crypto.randomBytes(20).toString("hex")
const expiracion = new Date (Date.now()+15*60*1000);
db.query("UPDATE usuarios SET reset_token=?,reset_expira=? WHERE correo=?",
[correo],
async(err,result)=>{
if (err)
return res.status(400).json("Error al generar el token")
const Link = `http://localhost:3000/ReestablecerPassword/${Token}`
await transporter.sendMail({
from: "Soporte <dkim44243@gmail.com>",
to : correo,
subject : "Reestablecer Contraseña",
html : `<h2>Reestablecer su contraseña</h2>
<p>haz click en este enlace para reestablecer su contraseña</p>
<a href="${Link}">${Link}</a>
<p>El enlace vence en 15 minutos</p>`
})
if (err){
console.log(err)
return res.status(400).json("Error al cambiar la contraseña")
}
res.status(200).json("Correo enviado exitosamente")
})})};


exports.ReestablecerPassword =(req,res)=>{
const {contraseña,Token}=req.body;
if (!contraseña){
return res.status(400).json("El campo es obligatorio")
}
if (contraseña.lengt <6){
return res.status(400).json("La contraseña debe de tener minimo 6 carectares")
}
db.query("SELECT * FROM usuarios WHERE reset_token = ? AND reset_expira >NOW()",
[Token],
async(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error en el servidor")
}
if (result.length ===0){
return res.status(400).json("Error al ingresar al token")
}
try{
const hashedPassword = await bcrypt(contraseña,10)
db.query("UPDATE usuarios SET contraseña=?, reset_token =NULL, reset_expira=NULL WHERE id=?",
[contraseña,result[0].id],
async(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al cambiar la contraseña")
}
res.status(200).json("Contraseña cambiada con exito")
})}
catch(err){
console.log("Error al cambiar la contraseña")
}})};


exports.ConsultarUsuario =(req,res)=>{
const {id}=req.params;
db.query("SELECT * FROM usuarios WHERE id=?",
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Usuario no encontrado")
}
res.send(result)
})};


exports.ObtenerUsuarios =(req,res)=>{
db.query("SELECT id,nombre,apellido,correo,estado,telefono,foto FROM usuarios",
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener los usuarios")
}
res.send(result)
})};



exports.ObtenerClientes =(req,res)=>{
db.query("SELECT nombre,apellido,documento,direccion,genero,email,tipo_documento FROM cliente=?",
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener los clientes")
}
res.send(result)
})};



exports.ActualizarUsuario =(req,res)=>{
const {nombre,apellido,correo,contraseña,estado}=req.body;
const {id}=req.params;
try{
const hashedPassword = await bcrypt.hash(contraseña,10);
db.query("UPDATE usuarios SET nombre=?,apellido=?,correo=?,contraseña=?,estado=? WHERE id=?",
[nombre,apellido,correo,hashedPassword,estado,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Usuario no actualizado")
}
res.send(result)
})}
catch(err){
console.log("Usuario no actualizado")
}};


exports.ActualizarPerfil =(req,res)=>{
const {correo,telefono}=req.body;
const {id}=req.params;
db.query("UPDATE usuarios SET correo=?,telefono=? WHERE id=?",
[correo,telefono,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al actualizar los datos")
}
res.send(result)
})};



exports.CambiarEstado =(req,res)=>{
const {estado}=req.body;
const {id}=req.params;
db.query("UPDATE usuarios SET estado = IF (estado ='activo','inactivo','activo') WHERE id=?",
[estado,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al cambiar el estado")
}
res.send(result)
})};


exports.SubirFoto =(req,res)=>{
const {id}=req.params;
const foto = req.file.filename;
db.query("UPDATE usuarios SET foto =? WHERE id=?",
[foto,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al subir la foto")
}
res.send(result)
})};


exports.EliminarUsuarios =(req,res)=>{
const {id}=req.params;
db.query("DELETE FROM usuarios WHERE id=?",
[id],
(err,result)=>{
if (err,result){
console.log(err)
return res.status(400).json("Usuario no eliminado")
}
res.send(result)
})};


exports.EliminarClientes =(req,res)=>{
const {id}=req.params;
db.query("DELETE FROM clientes WHERE id=?",
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Cliente no eliminado")
}
res.send(result)
})};


app.listen (PORT,()=>{
console.log (`Servidor corriendo por el puerto ${PORT}`)
});


