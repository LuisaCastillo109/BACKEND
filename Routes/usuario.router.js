const cors = require ("cors");
const express = require ("express");
const bodyParser = require ("body-parser");
const UsuarioControllers = require ("../Controllers/usuario.controller")
const {VerificarToken,TokenRol} = require ("../service/jwt")
const router = express.Router()
const multer = require ("multer")
const path = require ("path")

const app = express();
app.use (cors());
app.use (bodyParser.json());


const imagenes = multer.diskStorage({
destination : (req,file,cb)=>{
cb (null, path.join (__dirname,"..", "service", "uploads"))
},
filename : (req,file,cb)=>{
cb (null, Date.now()+path.extname(file.originalname))
}});
const imagen = multer({storage : imagenes});


/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.post("/crear",UsuarioControllers.CrearUsuario);
/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crear Clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Crear cliente
 */
router.post("/CrearCliente",UsuarioControllers.CrearCliente);
/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: consultar Usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Obtener Usuario por id
 */
router.get("/consultar/:id",VerificarToken,TokenRol([1]),UsuarioControllers.ConsultarUsuarios);
/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get("/ObtenerUsuarios",UsuarioControllers.ObtenerUsuarios);
/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Obtener Clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get("/ObtenerClientes",UsuarioControllers.ObtenerClientes);
/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido :
 *                  type : string
 *               correo:
 *                 type: string
 *               password:
 *                 type: string
 *
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put("/actualizar/:id",UsuarioControllers.ActualizarUsuarios);
/**
 * @swagger
 * /usuarios/{id}/foto:
 *   put:
 *     summary: Subir Foto
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subir foto de perfil del usuario
 */
router.put("/SubirFoto/:id",imagen.single("foto"),UsuarioControllers.SubirFoto);
/**
 * @swagger
 * /usuarios/{id}/estado:
 *   put:
 *     summary: Cambiar Estado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cambiar Estado de activo a inactivo o viceversa
 */
router.put("/CambiarEstado/:id",UsuarioControllers.CambiarEstado);
/**
 * @swagger
 * /usuarios/{id}/perfil:
 *   put:
 *     summary: Actualizar Perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Actualizar perfil del usuario
 */
router.put("/ActualizarPerfil/:id",UsuarioControllers.ActualizarPerfil);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eliminar Usuario por id
 */
router.delete("/eliminar/:id",VerificarToken,TokenRol([1]),UsuarioControllers.EliminarUsuarios);
/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Eliminar Clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eliminar Cliente por id
 */
router.delete("/EliminarClientes/:id",UsuarioControllers.EliminarClientes);
/**
 * @swagger
 * /usuarios/{login}:
 *   post:
 *     summary: Inicio de sesion
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inicio de sesion por usuario
 */
router.post("/login",UsuarioControllers.LoginUsuario);
/**
 * @swagger
 * /usuarios/{RecuperarPassword}:
 *   post:
 *     summary: Recuperar Contraseña
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recuperar contraseña mediante correo electronico
 */
router.post("/RecuperarPassword",UsuarioControllers.RecuperarPassword);
/**
 * @swagger
 * /usuarios/{ReestablecerContraseña}:
 *   post:
 *     summary: Reestablecer Contraseña
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reestablecer contraseña ingresando una nueva y verificandola
 */
router.post("/ReestablecerPassword",UsuarioControllers.ReestablecerPassword);


module.exports = router;







