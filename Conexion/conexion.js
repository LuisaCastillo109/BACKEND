const mysql = require ("mysql");
const cors = require ("cors");
const express = require ("express");
const bodyParser = require ("body-parser");

const app = express();
app.use (cors());
app.use (bodyParser.json());

const db = mysql.createConnection({
host : process.env.DB_HOST,
user : process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port : process.env.DB_PORT
});

db.connect((err)=>{
if (err){
console.log("Error en la conexion a la base de datos")
return 
}
console.log("Conectado a la base de datos")
});

module.exports = db;
