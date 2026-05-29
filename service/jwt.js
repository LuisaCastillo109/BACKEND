const jwt = require ("jsonwebtoken");

const VerificarToken = (req,res,nex)=>{
const AuthorizarToken = req.headers.authorization

if (!AuthorizarToken){
return res.status(400).json("Error al verificar el token")
}
const TokenAdmin = AuthorizarToken.split(" ")[1];
try{
const Token = jwt.verify(TokenAdmin,process.env.JWT_SECRET)
req.user = Token
next();
} 
catch(err){
console.log("Token expirado o invalido")
}};


const TokenRol =(permisoRol)=>{
return (req,res,next)=>{
if (!req.user || !req.user.rol){
return res.status(400).json("Rol desconocido")
}
if (!permisoRol.includes(req.user.rol)){
return res.status(400).json("Usted no tiene autorizacion para accerder aqui")
}
next();
}};


module.exports = {
VerificarToken,TokenRol
}