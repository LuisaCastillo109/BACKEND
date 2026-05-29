const express = require ("express")
const multer = require ("multer");
const path = require ("path")

const imagenes = multer.diskStorage({
destination : (req,file,cb)=>{
cb(null,path.join(__dirname,"uploads"))
},
filename : (req,file,cb)=>{
cb (null, Date.now+"-"+file.originalname)
}});

const imagen = multer({storage : imagenes});


const dir = path.join(__dirname,"uploads");
app.use ("/uploads", express.static(dir));