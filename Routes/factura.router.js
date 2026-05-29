const cors = require ("cors");
const express = require ("express");
const bodyParser = require ("body-parser");
const FacturaController = require("../Controllers/factura.controller")
const factura = express.Router();
const multer = require("multer");
const path = require("path");

const app = express();
app.use (cors());
app.use (bodyParser.json());

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "service", "uploads")); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storageConfig });

const SubirPDF = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "service", "pdf"));
  },
  filename : (req,file,cb)=>{
  cb (null, Date.now()+path.extname(file.originalname))
  }});

const PDF = multer({
  storage: SubirPDF,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten pdf"), false);
    }
  }
});


factura.post("/crearFactura",FacturaController.CrearFactura);
factura.post("/EnviarFacturaFisica/:id",FacturaController.EnviarFacturaFisica);
factura.post("/CrearProducto", upload.single("imagen"),FacturaController.CrearProducto);
factura.get("/ObtenerFacturas/:id",FacturaController.ObtenerFacturas);
factura.get("/ConsultarFactura/:id",FacturaController.ConsultarFactura);
factura.get("/ObtenerClientesConFacturas",FacturaController.ObtenerClientesConFacturas);
factura.get("/ObtenerFacturaCompleta/:id",FacturaController.ObtenerFacturaCompleta);
factura.get("/ObtenerClientes/:id",FacturaController.ObtenerClientes);
factura.get("/VentasMensuales/:id",FacturaController.VentasMensuales);
factura.get("/DetalleFactura",FacturaController.DetalleFactura);
factura.get("/VentasPorProducto/:id",FacturaController.VentasPorProducto);
factura.put("/PagarFactura/:id",FacturaController.PagarFactura);
factura.put("/SubirPDF/:id", PDF.single("pdf"),FacturaController.SubirPDF);
factura.put("/ActualizarProducto/:id", upload.single("imagen"), FacturaController.ActualizarProducto);
factura.put("/subirFotoProducto",FacturaController.subirFotoProducto);
factura.delete("/EliminarFactura/:id",FacturaController.EliminarFactura);
factura.delete("/EliminarProducto/:id",FacturaController.EliminarProducto);
factura.get("/ObtenerProductos/:id",FacturaController.ObtenerProductos);
factura.get("/ObtenerDashboard/:id",FacturaController.ObtenerDashboard);

module.exports = factura;




