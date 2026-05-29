require("dotenv").config();
const db = require("../Conexion/conexion");
const transporter = require ("../service/configuracion")
const path = require ("path")
const fs =  require('fs');
const PDFDocument = require('pdfkit'); 

exports.CrearFactura = (req, res) => {
  const {
    usuario_id,
    items,
    subtotal,
    iva,
    total,
    metodo_pago,
    id_cliente,
    pdf
  } = req.body;

  // 🔴 VALIDACIONES COMPLETAS
  if (
    !usuario_id ||
    !items ||
    items.length === 0 ||
    !metodo_pago ||
    !id_cliente
  ) {
    return res.status(400).json({
      mensaje: "Datos incompletos",
      datos: req.body // 🔥 para depurar
    });
  }

  console.log("DATOS RECIBIDOS:", req.body);

  // 🔥 INSERT FACTURA
  db.query(
    "INSERT INTO facturas (usuario_id, subtotal, iva, total, metodo_pago, estado, id_cliente, pdf) VALUES (?,?,?,?,?,?,?,?)",
    [
      usuario_id,
      subtotal,
      iva,
      total,
      metodo_pago,
      "PENDIENTE",
      id_cliente,
      pdf || null
    ],
    (err, result) => {
      if (err) {
        console.error("ERROR INSERT FACTURA:", err);
        return res.status(400).json("Error al crear la factura");
      }

      const facturaId = result.insertId;

      let totalCalculado = 0;

      // 🔥 INSERT DETALLE + UPDATE STOCK
      items.forEach((item) => {
        if (!item.producto_id || !item.cantidad || !item.precio) {
          console.error("ITEM INVÁLIDO:", item);
          return;
        }

        totalCalculado += item.precio * item.cantidad;

        db.query(
          "INSERT INTO detalle_factura (factura_id, producto_id, cantidad, precio_unitario) VALUES (?,?,?,?)",
          [facturaId, item.producto_id, item.cantidad, item.precio],
          (err) => {
            if (err) {
              console.error("ERROR DETALLE:", err);
            }
          }
        );

        db.query(
          "UPDATE productos SET stock = stock - ? WHERE id = ?",
          [item.cantidad, item.producto_id],
          (err) => {
            if (err) {
              console.error("ERROR STOCK:", err);
            }
          }
        );
      });

      // 🔥 ACTUALIZAR TOTAL CALCULADO
      db.query(
        "UPDATE facturas SET total=? WHERE id=?",
        [totalCalculado, facturaId],
        (err) => {
          if (err) {
            console.error("ERROR UPDATE TOTAL:", err);
            return res.status(400).json("Error al actualizar total");
          }

          res.status(200).json({
            mensaje: "Factura creada correctamente",
            id: facturaId,
            usuario_id,
            subtotal,
            iva,
            total: totalCalculado,
            metodo_pago,
            items
          });
        }
      );
    }
  );
};


exports.ConsultarFactura=(req,res)=>{
const {id}=req.params;
db.query(`SELECT u.nombre,u.apellido,p.nombre AS nombre_producto,d.cantidad,f.subtotal,f.pdf,f.iva,f.total
FROM facturas f INNER JOIN usuarios u ON f.usuario_id = u.id INNER JOIN detalle_factura d ON  f.id = d.factura_id
INNER JOIN productos p ON d.producto_id = p.id  WHERE f.id=?`,
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al consultar la factura")
}
res.send(result)
})};


exports.ObtenerFacturas =(req,res)=>{
const {id}=req.params;
db.query(`SELECT f.id,f.usuario_id,f.id_cliente,f.pdf,c.nombre,c.apellido,c.tipo_documento,f.subtotal,f.iva,f.total,f.metodo_pago,f.estado,f.fecha,
p.nombre AS nombre_producto,
d.cantidad FROM facturas f INNER JOIN clientes c ON f.id_cliente = c.id
INNER JOIN detalle_factura d ON f.id = d.factura_id
INNER JOIN productos p ON d.producto_id = p.id  WHERE f.usuario_id =?`,
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener las facturas")
}
res.send(result)
})};

exports.ObtenerProductos =(req,res)=>{
const {id}=req.params;
db.query("SELECT * FROM productos WHERE usuario_id=?",
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener los productos")
}
res.send(result)
})};


exports.DetalleFactura =(req,res)=>{
db.query(`SELECT d.id,d.factura_id,f.pdf,d.producto_id,d.cantidad,d.precio_unitario,p.nombre FROM detalle_factura d
INNER JOIN productos p ON d.producto_id = p.id `,
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Erro al obtener el detalle de facturas")
}
res.send(result)
})};

/* =========================
   PAGAR FACTURA
========================= */
exports.PagarFactura = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE facturas SET estado='PAGADA' WHERE id=?",
    [id],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json("Error al pagar la factura");
      }
      res.status(200).json("Factura pagada");
    }
  );
};

/* =========================
   ELIMINAR FACTURA
========================= */
exports.EliminarFactura = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM facturas WHERE id=?",
    [id],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json("Factura no eliminada");
      }
      res.status(200).json("Factura eliminada");
    }
  );
};

/* =========================
   DATOS DEL DASHBOARD
========================= */
exports.ObtenerDashboard = (req, res) => {
  const {id}=req.params;
  const sqlClientes = "SELECT COUNT(*) AS total FROM clientes WHERE usuario_id =?"; 
  const sqlFacturas = "SELECT COUNT(*) AS total FROM facturas WHERE usuario_id =?";
  
  const sqlVentas = `
    SELECT SUM(df.cantidad * df.precio_unitario) AS total 
    FROM detalle_factura df
    JOIN facturas f ON df.factura_id = f.id
    WHERE f.estado = 'PAGADA' AND f.usuario_id = ?
  `;

  db.query(sqlClientes, [id], (err, resClientes) => {
    if (err) return res.status(500).json(err);

    db.query(sqlFacturas, [id], (err, resFacturas) => {
      if (err) return res.status(500).json(err);

      db.query(sqlVentas,[id], (err, resVentas) => {
        if (err) return res.status(500).json(err);

        res.status(200).json({
          clientes: resClientes[0].total || 0,
          facturas: resFacturas[0].total || 0,
          // resVentas[0].total devolverá la suma de lo que vemos en tu captura
          ventas: resVentas[0].total || 0
        });
      });
    });
  });
};

exports.CrearProducto = (req, res) => {
  const { nombre,precio,stock,descripcion,estado,usuario_id}=req.body;
  const imagen = req.file ? req.file.filename : null;

  db.query(
    "INSERT INTO productos (nombre, precio, stock, imagen, descripcion, estado, usuario_id) VALUES (?,?,?,?,?,?,?)",
    [nombre, precio, stock, imagen,descripcion,estado,usuario_id],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json("Error al crear producto");
      }
      res.json("Producto creado");
    }
  );
};

exports.ActualizarProducto = (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, descripcion, estado } = req.body;
  let sql = "UPDATE productos SET nombre=?, precio=?, stock=?, descripcion=?, estado=? WHERE id=?";
  let params = [nombre, precio, stock, descripcion, estado, id];

  if (req.file) {
    sql = "UPDATE productos SET nombre=?, precio=?, stock=?, descripcion=?, estado=?, imagen=? WHERE id=?";
    params = [nombre, precio, stock, descripcion, estado, req.file.filename, id];
  }

  db.query(sql, params, (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json("Error al actualizar");
    }
    res.json("Producto actualizado correctamente");
  });
};

exports.EliminarProducto = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM productos WHERE id=?", [id], (err) => {
    if (err) return res.status(400).json("Error al eliminar");
    res.json("Producto eliminado");
  });
};

exports.subirFotoProducto=(req,res)=>{
const {id}= req.params;
const iamgen= req.file.filename;
db.query("UPDATE facturas SET iamgen=? WHERE id=?",
[iamgen,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al subir la foto")
}
res.send(result)
})};

exports.ObtenerClientes =(req,res)=>{
const {id}=req.params;
db.query(
"SELECT * FROM clientes WHERE usuario_id=?",
[id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al obtener clientes")
}
res.send(result)
})};

exports.ObtenerClientesConFacturas = (req, res) => {
  const sql = `
    SELECT 
      c.id AS id_cliente,
      c.nombre,
      c.apellido,
      c.documento,
      c.email,
      c.direccion,
      c.tipo_documento,
      c.telefono,
      c.usuario_id,
      f.id AS factura_id,
      f.total,
      f.subtotal,
      f.iva,
      f.metodo_pago,
      f.estado,
      f.fecha,
      f.pdf

    FROM clientes c
    INNER JOIN facturas f ON c.id = f.id_cliente
    ORDER BY c.id ASC, f.fecha DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json("Error al obtener los clientes con facturas");
    }
    res.json(result);
  });
};


exports.ObtenerFacturaCompleta = (req, res) => {
  const { id } = req.params;
  db.query(`SELECT f.id, f.fecha, f.subtotal, f.iva, f.total, f.metodo_pago, f.estado, 
  c.nombre, c.apellido, c.email, c.telefono, c.direccion, c.documento, p.nombre AS producto,
 d.cantidad, d.precio_unitario FROM facturas f INNER JOIN clientes c
 ON f.id_cliente = c.id INNER JOIN detalle_factura d ON f.id = d.factura_id 
 INNER JOIN productos p ON d.producto_id = p.id WHERE f.id = ?`,
  [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json("Error al obtener factura");
    }
    res.json(result);
  });
};

/* =========================
   VENTAS MENSUALES (TORTA)
========================= */
exports.VentasMensuales = (req, res) => {
  const {id}=req.params;
  const sql = `
    SELECT 
      DATE_FORMAT(f.fecha, '%Y-%m') AS mes,
      SUM(df.cantidad * df.precio_unitario) AS total
    FROM facturas f
    JOIN detalle_factura df ON f.id = df.factura_id
    WHERE f.estado = 'PAGADA' AND f.usuario_id =?
    GROUP BY mes
    ORDER BY mes ASC
  `;

  db.query(sql,[id],(err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json("Error al obtener ventas");
    }
    res.json(result);
  })}


exports.VentasPorProducto = (req, res) => {
  const {id}=req.params;
  const sql = `
    SELECT 
      p.nombre AS producto,
      SUM(df.cantidad * df.precio_unitario) AS total
    FROM detalle_factura df
    JOIN productos p ON df.producto_id = p.id
    JOIN facturas f ON df.factura_id = f.id
    WHERE f.estado = 'PAGADA' AND f.usuario_id =?
    GROUP BY p.nombre
    ORDER BY total DESC
    LIMIT 6
  `;

  db.query(sql,[id],(err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json("Error en ventas por producto");
    }
    res.json(result);
  });
};

exports.SubirPDF = (req,res)=>{
const {id}=req.params;
const pdf = req.file.filename;
db.query("UPDATE facturas SET pdf =? WHERE id=?",
[pdf,id],
(err,result)=>{
if (err){
console.log(err)
return res.status(400).json("Error al generar el pdf")
}
res.send(result)
})}

exports.EnviarFacturaFisica = (req, res) => {
const { id } = req.params;
db.query(`SELECT f.id, c.email, c.nombre, c.apellido FROM facturas f 
INNER JOIN clientes c ON f.id_cliente = c.id WHERE f.id = ?`,
[id],
async (err, result) => {
if (err || result.length === 0) {
return res.status(404).json("No se encontró la factura o el cliente");
}
const cliente = result[0];
const nombreArchivo = `factura_${id}.pdf`;
const rutaFisicaPDF = path.join(__dirname, "..", "service", "pdf", nombreArchivo);
/* Validacion de que exista el archivo en la carpeta*/
if (!fs.existsSync(rutaFisicaPDF)) {
console.error(`El archivo ${nombreArchivo} no existe en la carpeta.`);
return res.status(404).json(`El archivo físico ${nombreArchivo} no se encuentra en la carpeta PDF todavía.`);
}
try {
      await transporter.sendMail({
        from: '"Misamooo" <dkim44243@gmail.com>',
        to: cliente.email,
        subject: `Factura Electrónica No. ${id}`,
        html: `<p>Hola ${cliente.nombre} ${cliente.apellido}, adjuntamos tu factura original. ¡Gracias por tu compra!</p>`,
        attachments: [
          {
            filename: nombreArchivo,
            path: rutaFisicaPDF,
          },
        ],
      });

      console.log(`Factura ${id} enviada correctamente por correo.`);
      return res.status(200).json("Correo enviado con éxito");

    } catch (correoErr) {
      console.error("Error en Nodemailer:", correoErr);
      return res.status(500).json("Error al despachar el correo electrónico");
    }
  });
};
