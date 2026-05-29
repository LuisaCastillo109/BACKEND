require("dotenv").config();
const bcrypt = require ("bcrypt");
const crypto = require ("crypto");
const db = require ("../Conexion/conexion")
const jwt = require ("jsonwebtoken");
const transporter = require ("../service/configuracion")

exports.CrearUsuario =(req,res)=>{
const {nombre,apellido,correo,contraseña,rol}=req.body;
if (!nombre || !apellido || !correo || !contraseña){
return res.status(400).json("Todos los datos deben de estar llenos")
}
if (contraseña.length <6){
return res.status(400).json("La contraseña debe de tener mas de 6 caracteres")
}
db.query("SELECT * FROM usuarios WHERE correo=?",
[correo],
async(err,result)=>{
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
[nombre,apellido,correo,hashedPassword,Rol,estado],
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


exports.CrearCliente =(req,res)=>{
const {nombre,apellido,direccion,telefono,documento,email,tipo_documento,pdf,usuario_id}=req.body;
if (!nombre || !apellido || !direccion || !telefono ||!documento ||!email ||!tipo_documento){
return res.status(400).json("Todos los datos deben de estar completo")
}
db.query("INSERT INTO clientes (nombre,apellido,direccion,telefono,documento,email,tipo_documento,pdf,usuario_id) VALUES (?,?,?,?,?,?,?,?,?)",
[nombre,apellido,direccion,telefono,documento,email,tipo_documento,pdf,usuario_id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al crear el cliente")
}
res.send(result)
})};


exports.LoginUsuario =(req,res)=>{
const {correo,contraseña}=req.body;
if (!correo || !contraseña){
return res.status(400).json("Los datos deben de estar completos")
}
db.query("SELECT * FROM usuarios WHERE correo=?",
[correo],
async(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error en el servidor")
}
if (result.length ===0){
return res.status(400).json("El correo no existe en el sistema")
}
const usuario = result[0];
if (usuario.estado==="inactivo"){
return res.status(400).json("Usuario inactivo, contacte al administrador")
}
const ConfirmarContraseña = await bcrypt.compare(
contraseña,
usuario.contraseña
)
if (!ConfirmarContraseña){
return res.status(400).json("Contraseña incorrecta")
}
const Token = jwt.sign({
id : usuario.id,
rol : usuario.rol
},
process.env.JWT_SECRET,
{expiresIn : "1h"}
)
res.status(200).json({
mensaje : "Ingreso Exitoso",
Token,
usuario :{
id : usuario.id,
nombre : usuario.nombre,
apellido : usuario.apellido,
correo : usuario.correo,
rol : usuario.rol,
telefono : usuario.telefono,
estado : usuario.estado,
foto : usuario.foto
}})})};


exports.RecuperarPassword = (req,res)=>{
const {correo}=req.body;
if (!correo){
return res.status(400).json("El campo es obligatorio")
}
db.query("SELECT * FROM usuarios WHERE correo=?",
[correo],
async(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error en el servidor")
}
if (result.length ===0){
return res.status(400).json("El correo no existe en el sistema")
}
const Token = crypto.randomBytes(20).toString("hex")
const expiracion = new Date (Date.now()+15*60*1000)
db.query("UPDATE usuarios SET reset_token=?, reset_expira=? WHERE correo=?",
[Token,expiracion,correo],
async(err,result)=>{
if (err)
return res.status(400).json("Error al generar el token")
const Link = `http://localhost:3000/ReestablecerPassword/${Token}`
await transporter.sendMail({
from :"Soporte <dkim44243@gmail.com>",
to : correo,
subject : "Reestablecer Contraseña",
html : `<h2>Reestablecer Contraseña</h2>
<p>Haz  click en este enlace para reestablecer su contraseña</p>
<a href = "${Link}">${Link}</a>
<p>El enlace vence en 15 minutos</p>`
})
if (err){
return res.status(400).json("Error al enviar el correo electronico")
}
res.status(200).json("Correo enviado exitosamente")
})})};


exports.ReestablecerPassword =(req,res)=>{
const {contraseña,Token}=req.body;
if (!contraseña){
return res.status(400).json("El campo es obligatorio")
}
if (contraseña.length <6){
return res.status(400).json("La contraseña debe de tener minimo 6 caracteres")
}
db.query("SELECT * FROM usuarios WHERE reset_token=? AND reset_expira >NOW()",
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
const hashedPassword = await bcrypt.hash(contraseña,10)
db.query("UPDATE usuarios SET contraseña=?, reset_token = NULL, reset_expira=NULL WHERE id=?",
[hashedPassword,result[0].id],
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


exports.ConsultarUsuarios =(req,res)=>{
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


exports.ObtenerUsuarios = (req,res)=>{
db.query("SELECT id,nombre,apellido,correo,rol,estado,telefono,foto FROM usuarios",
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener los usuarios")
}
res.send(result)
})};


exports.ObtenerClientes =(req,res)=>{
db.query("SELECT id,nombre,apellido,email,pdf,direccion,genero,telefono,documento,usuario_id FROM clientes",
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener los usuarios")
}
res.send(result)
})}


exports.ActualizarUsuarios =async(req,res)=>{
const {nombre,apellido,correo,contraseña,estado}=req.body;
const {id}=req.params;
try{
const hashedPassword = await bcrypt.hash(contraseña,10)
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


exports.EliminarUsuarios =(req,res)=>{
const {id}=req.params;
db.query("DELETE FROM usuarios WHERE id=?",
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Usuario no eliminado")
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


exports.CambiarEstado = (req,res)=>{
const {id}=req.params;
const {estado}=req.body;
db.query("UPDATE usuarios SET estado = IF (estado = 'activo','inactivo','activo')",
[estado,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al actualizar el estado")
}
res.send(result)
})};


exports.ActualizarPerfil =(req,res)=>{
const {id}=req.params;
const {correo,telefono}=req.body;
db.query("UPDATE usuarios SET correo=?,telefono=? WHERE id=?",
[correo,telefono,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error a actualizar los datos")
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
return res.status(400).json("Error al eliminar el cliente")
}
res.send(result)
})};


