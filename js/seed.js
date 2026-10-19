/* ================================================
   Seed Data — Datos de ejemplo realistas
   para la cafetería "Oveja Negra"
   ================================================ */

function seedDatabase() {
  // Cargar datos semilla si no existen o si están vacíos
  if (DB.isSeeded() && DB._getTable('clientes').length > 0) {
    ensureUsersSeeded();
    return;
  }


  // ---- Clientes ----
  const clientes = [
    { id: 'c001', nombres: 'María Fernanda López', fecha_nacimiento: '1990-03-15', genero: 'Femenino', cedula: '1804567890', email: 'maria.lopez@email.com', celular: '0987654321', red_social: 'Instagram', ciudad: 'Ambato', direccion: 'Av. Cevallos y Sucre', ocupacion: 'Diseñadora Gráfica', tipo_cliente: 'Individual', producto_favorito: 'Cappuccino', gasto_acumulado: 245.50, frecuencia_compra: 'Semanal', num_compras: 48, preferencia_horario: 'Mañana', nivel_fidelizacion: 'VIP', observaciones: 'Siempre pide extra espuma', preferencia_consumo: 'En local' },
    { id: 'c002', nombres: 'Carlos Andrés Medina', fecha_nacimiento: '1985-07-22', genero: 'Masculino', cedula: '1801234567', email: 'carlos.medina@email.com', celular: '0991234567', red_social: 'Facebook', ciudad: 'Ambato', direccion: 'Calle Bolívar 234', ocupacion: 'Ingeniero Civil', tipo_cliente: 'Individual', producto_favorito: 'Americano', gasto_acumulado: 189.00, frecuencia_compra: 'Diario', num_compras: 95, preferencia_horario: 'Mañana', nivel_fidelizacion: 'VIP', observaciones: 'Cliente desde la apertura', preferencia_consumo: 'Para llevar' },
    { id: 'c003', nombres: 'Ana Lucía Torres', fecha_nacimiento: '1995-11-08', genero: 'Femenino', cedula: '1807654321', email: 'ana.torres@email.com', celular: '0985678901', red_social: 'Instagram', ciudad: 'Ambato', direccion: 'Urdesa Norte Mz 5', ocupacion: 'Abogada', tipo_cliente: 'Individual', producto_favorito: 'Latte Vainilla', gasto_acumulado: 156.75, frecuencia_compra: 'Semanal', num_compras: 32, preferencia_horario: 'Tarde', nivel_fidelizacion: 'Fidelizado', observaciones: 'Prefiere leche de almendras', preferencia_consumo: 'En local' },
    { id: 'c004', nombres: 'Roberto Alejandro Vega', fecha_nacimiento: '1988-01-30', genero: 'Masculino', cedula: '1809876543', email: 'roberto.vega@empresa.com', celular: '0993456789', red_social: 'LinkedIn', ciudad: 'Ambato', direccion: 'Parque Industrial Km 5', ocupacion: 'Gerente de Ventas', tipo_cliente: 'Corporativo', producto_favorito: 'Espresso Doble', gasto_acumulado: 420.00, frecuencia_compra: 'Diario', num_compras: 120, preferencia_horario: 'Mañana', nivel_fidelizacion: 'VIP', observaciones: 'Pedidos corporativos frecuentes', preferencia_consumo: 'Delivery' },
    { id: 'c005', nombres: 'Sofía Valentina Ruiz', fecha_nacimiento: '1998-05-12', genero: 'Femenino', cedula: '1803456789', email: 'sofia.ruiz@email.com', celular: '0987123456', red_social: 'TikTok', ciudad: 'Ambato', direccion: 'Av. Los Guaytambos 456', ocupacion: 'Estudiante', tipo_cliente: 'Individual', producto_favorito: 'Frappé de Chocolate', gasto_acumulado: 78.50, frecuencia_compra: 'Quincenal', num_compras: 15, preferencia_horario: 'Tarde', nivel_fidelizacion: 'Frecuente', observaciones: 'Viene con grupo de estudio', preferencia_consumo: 'En local' },
    { id: 'c006', nombres: 'Diego Fernando Morales', fecha_nacimiento: '1992-09-03', genero: 'Masculino', cedula: '1806543210', email: 'diego.morales@email.com', celular: '0989012345', red_social: 'Instagram', ciudad: 'Baños', direccion: 'Calle Ambato y Halfants', ocupacion: 'Chef', tipo_cliente: 'Individual', producto_favorito: 'Mocaccino', gasto_acumulado: 134.25, frecuencia_compra: 'Semanal', num_compras: 28, preferencia_horario: 'Noche', nivel_fidelizacion: 'Fidelizado', observaciones: 'Experto en café, da retroalimentación', preferencia_consumo: 'En local' },
    { id: 'c007', nombres: 'Gabriela Estefanía Paredes', fecha_nacimiento: '1993-12-20', genero: 'Femenino', cedula: '1802345678', email: 'gabriela.paredes@email.com', celular: '0986789012', red_social: 'Facebook', ciudad: 'Ambato', direccion: 'Ficoa, calle las Flores', ocupacion: 'Periodista', tipo_cliente: 'Individual', producto_favorito: 'Té Chai Latte', gasto_acumulado: 98.00, frecuencia_compra: 'Semanal', num_compras: 22, preferencia_horario: 'Mañana', nivel_fidelizacion: 'Frecuente', observaciones: 'Suele trabajar en la cafetería', preferencia_consumo: 'En local' },
    { id: 'c008', nombres: 'Andrés Sebastián Castro', fecha_nacimiento: '1987-04-18', genero: 'Masculino', cedula: '1808765432', email: 'andres.castro@corp.com', celular: '0992345678', red_social: 'LinkedIn', ciudad: 'Ambato', direccion: 'Centro, calle Martínez', ocupacion: 'Contador', tipo_cliente: 'Corporativo', producto_favorito: 'Americano', gasto_acumulado: 310.75, frecuencia_compra: 'Diario', num_compras: 85, preferencia_horario: 'Mañana', nivel_fidelizacion: 'VIP', observaciones: 'Paga con tarjeta corporativa', preferencia_consumo: 'Para llevar' },
    { id: 'c009', nombres: 'Valeria Nicole Herrera', fecha_nacimiento: '2000-08-25', genero: 'Femenino', cedula: '1805432109', email: 'valeria.herrera@email.com', celular: '0984567890', red_social: 'TikTok', ciudad: 'Ambato', direccion: 'Huachi Chico', ocupacion: 'Fotógrafa', tipo_cliente: 'Individual', producto_favorito: 'Cold Brew', gasto_acumulado: 62.50, frecuencia_compra: 'Quincenal', num_compras: 12, preferencia_horario: 'Tarde', nivel_fidelizacion: 'Normal', observaciones: 'Le gustan los ambientes fotogénicos', preferencia_consumo: 'En local' },
    { id: 'c010', nombres: 'Luis Miguel Ortega', fecha_nacimiento: '1982-06-10', genero: 'Masculino', cedula: '1801098765', email: 'luis.ortega@email.com', celular: '0990123456', red_social: 'Facebook', ciudad: 'Ambato', direccion: 'Av. Rodrigo Pachano', ocupacion: 'Médico', tipo_cliente: 'Individual', producto_favorito: 'Espresso', gasto_acumulado: 175.00, frecuencia_compra: 'Semanal', num_compras: 40, preferencia_horario: 'Mañana', nivel_fidelizacion: 'Fidelizado', observaciones: 'Siempre puntual a las 7am', preferencia_consumo: 'Para llevar' },
    { id: 'c011', nombres: 'Camila Alejandra Reyes', fecha_nacimiento: '1996-02-14', genero: 'Femenino', cedula: '1804321098', email: 'camila.reyes@email.com', celular: '0983456789', red_social: 'Instagram', ciudad: 'Pelileo', direccion: 'Calle Principal y 24 de Mayo', ocupacion: 'Profesora', tipo_cliente: 'Individual', producto_favorito: 'Chocolate Caliente', gasto_acumulado: 56.25, frecuencia_compra: 'Mensual', num_compras: 8, preferencia_horario: 'Tarde', nivel_fidelizacion: 'Normal', observaciones: 'Viene los fines de semana', preferencia_consumo: 'En local' },
    { id: 'c012', nombres: 'Empresa TechSoft S.A.', fecha_nacimiento: '', genero: 'N/A', cedula: '1891234567001', email: 'compras@techsoft.ec', celular: '0322456789', red_social: 'LinkedIn', ciudad: 'Ambato', direccion: 'Parque Industrial', ocupacion: 'Empresa Tecnológica', tipo_cliente: 'Corporativo', producto_favorito: 'Café Americano (caja)', gasto_acumulado: 850.00, frecuencia_compra: 'Semanal', num_compras: 52, preferencia_horario: 'Mañana', nivel_fidelizacion: 'VIP', observaciones: 'Pedidos para reuniones de equipo, 15 personas', preferencia_consumo: 'Delivery' },
    { id: 'c013', nombres: 'Paola Mercedes Aguirre', fecha_nacimiento: '1991-10-05', genero: 'Femenino', cedula: '1803210987', email: 'paola.aguirre@email.com', celular: '0982345678', red_social: 'Instagram', ciudad: 'Ambato', direccion: 'Miraflores Alto', ocupacion: 'Arquitecta', tipo_cliente: 'Individual', producto_favorito: 'Flat White', gasto_acumulado: 142.00, frecuencia_compra: 'Semanal', num_compras: 35, preferencia_horario: 'Mañana', nivel_fidelizacion: 'Fidelizado', observaciones: 'Trae su propio vaso reutilizable', preferencia_consumo: 'Para llevar' },
    { id: 'c014', nombres: 'Javier Ernesto Salazar', fecha_nacimiento: '1989-03-28', genero: 'Masculino', cedula: '1806789012', email: 'javier.salazar@email.com', celular: '0981234567', red_social: 'TikTok', ciudad: 'Ambato', direccion: 'La Viña, calle Los Olivos', ocupacion: 'Músico', tipo_cliente: 'Individual', producto_favorito: 'Mocaccino', gasto_acumulado: 88.75, frecuencia_compra: 'Semanal', num_compras: 20, preferencia_horario: 'Noche', nivel_fidelizacion: 'Frecuente', observaciones: 'Viene a tocar guitarra los jueves', preferencia_consumo: 'En local' },
    { id: 'c015', nombres: 'Isabella Cristina Mendoza', fecha_nacimiento: '1997-07-16', genero: 'Femenino', cedula: '1805678901', email: 'isabella.mendoza@email.com', celular: '0980123456', red_social: 'Instagram', ciudad: 'Ambato', direccion: 'Cdla. España', ocupacion: 'Community Manager', tipo_cliente: 'Individual', producto_favorito: 'Matcha Latte', gasto_acumulado: 104.50, frecuencia_compra: 'Semanal', num_compras: 25, preferencia_horario: 'Tarde', nivel_fidelizacion: 'Frecuente', observaciones: 'Siempre toma fotos del café para redes', preferencia_consumo: 'En local' }
  ];

  // ---- Productos ----
  const productos = [
    { id: 'p001', tipo_producto: 'Café Caliente', nombre: 'Espresso', codigo: 'CAF-001', precio: 1.75, disponible: true, tiempo_espera: 3, imagen_url: '', stock_actual: 100, mas_vendido: true },
    { id: 'p002', tipo_producto: 'Café Caliente', nombre: 'Americano', codigo: 'CAF-002', precio: 2.25, disponible: true, tiempo_espera: 3, imagen_url: '', stock_actual: 100, mas_vendido: true },
    { id: 'p003', tipo_producto: 'Café Caliente', nombre: 'Cappuccino', codigo: 'CAF-003', precio: 3.50, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 80, mas_vendido: true },
    { id: 'p004', tipo_producto: 'Café Caliente', nombre: 'Latte Vainilla', codigo: 'CAF-004', precio: 3.75, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 60, mas_vendido: false },
    { id: 'p005', tipo_producto: 'Café Caliente', nombre: 'Mocaccino', codigo: 'CAF-005', precio: 3.50, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 70, mas_vendido: false },
    { id: 'p006', tipo_producto: 'Café Caliente', nombre: 'Flat White', codigo: 'CAF-006', precio: 3.25, disponible: true, tiempo_espera: 4, imagen_url: '', stock_actual: 50, mas_vendido: false },
    { id: 'p007', tipo_producto: 'Café Caliente', nombre: 'Espresso Doble', codigo: 'CAF-007', precio: 2.50, disponible: true, tiempo_espera: 3, imagen_url: '', stock_actual: 90, mas_vendido: false },
    { id: 'p008', tipo_producto: 'Bebida Fría', nombre: 'Cold Brew', codigo: 'BEB-001', precio: 3.50, disponible: true, tiempo_espera: 2, imagen_url: '', stock_actual: 45, mas_vendido: false },
    { id: 'p009', tipo_producto: 'Bebida Fría', nombre: 'Frappé de Chocolate', codigo: 'BEB-002', precio: 4.25, disponible: true, tiempo_espera: 7, imagen_url: '', stock_actual: 40, mas_vendido: true },
    { id: 'p010', tipo_producto: 'Bebida Fría', nombre: 'Frappé de Caramelo', codigo: 'BEB-003', precio: 4.25, disponible: true, tiempo_espera: 7, imagen_url: '', stock_actual: 35, mas_vendido: false },
    { id: 'p011', tipo_producto: 'Bebida Fría', nombre: 'Limonada de Maracuyá', codigo: 'BEB-004', precio: 3.00, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 30, mas_vendido: false },
    { id: 'p012', tipo_producto: 'Té', nombre: 'Té Chai Latte', codigo: 'TE-001', precio: 3.25, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 25, mas_vendido: false },
    { id: 'p013', tipo_producto: 'Té', nombre: 'Matcha Latte', codigo: 'TE-002', precio: 4.00, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 20, mas_vendido: false },
    { id: 'p014', tipo_producto: 'Postre', nombre: 'Cheesecake de Frutos Rojos', codigo: 'POS-001', precio: 4.50, disponible: true, tiempo_espera: 0, imagen_url: '', stock_actual: 8, mas_vendido: true },
    { id: 'p015', tipo_producto: 'Postre', nombre: 'Brownie con Helado', codigo: 'POS-002', precio: 4.00, disponible: true, tiempo_espera: 3, imagen_url: '', stock_actual: 12, mas_vendido: false },
    { id: 'p016', tipo_producto: 'Postre', nombre: 'Croissant de Almendras', codigo: 'POS-003', precio: 3.25, disponible: true, tiempo_espera: 0, imagen_url: '', stock_actual: 5, mas_vendido: false },
    { id: 'p017', tipo_producto: 'Bebida Caliente', nombre: 'Chocolate Caliente', codigo: 'BCA-001', precio: 3.00, disponible: true, tiempo_espera: 5, imagen_url: '', stock_actual: 55, mas_vendido: false },
    { id: 'p018', tipo_producto: 'Snack', nombre: 'Sandwich Club', codigo: 'SNK-001', precio: 5.50, disponible: true, tiempo_espera: 10, imagen_url: '', stock_actual: 15, mas_vendido: false },
    { id: 'p019', tipo_producto: 'Snack', nombre: 'Wrap de Pollo', codigo: 'SNK-002', precio: 5.00, disponible: true, tiempo_espera: 10, imagen_url: '', stock_actual: 10, mas_vendido: false },
    { id: 'p020', tipo_producto: 'Desayuno', nombre: 'Desayuno Oveja Negra', codigo: 'DES-001', precio: 7.50, disponible: true, tiempo_espera: 15, imagen_url: '', stock_actual: 20, mas_vendido: true }
  ];

  // ---- Ventas (últimos 30 días) ----
  const hoy = new Date();
  const ventas = [];
  const estados = ['Pendiente', 'Confirmado', 'Preparado', 'Entregado', 'Cancelado'];
  const metodos = ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'PayPhone'];
  const bancos = ['Pichincha', 'Guayaquil', 'Pacífico', 'Produbanco', 'Bolivariano', ''];

  for (let i = 0; i < 45; i++) {
    const diasAtras = Math.floor(Math.random() * 30);
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() - diasAtras);
    const clienteIdx = Math.floor(Math.random() * clientes.length);
    const productoIdx = Math.floor(Math.random() * productos.length);
    const cantidad = Math.floor(Math.random() * 3) + 1;
    const precio = productos[productoIdx].precio;
    const subtotal = +(precio * cantidad).toFixed(2);
    const descuento = Math.random() > 0.7 ? +(subtotal * 0.1).toFixed(2) : 0;
    const impuesto = +((subtotal - descuento) * 0.15).toFixed(2);
    const total = +(subtotal - descuento + impuesto).toFixed(2);
    const estadoIdx = i < 5 ? 0 : (i < 8 ? 1 : (i < 12 ? 2 : (Math.random() > 0.1 ? 3 : 4)));

    ventas.push({
      id: `v${String(i + 1).padStart(3, '0')}`,
      codigo_pedido: `PED-${String(1000 + i)}`,
      cliente_id: clientes[clienteIdx].id,
      cliente_nombre: clientes[clienteIdx].nombres,
      fecha_pedido: fecha.toISOString().split('T')[0],
      producto_id: productos[productoIdx].id,
      producto_nombre: productos[productoIdx].nombre,
      promocion_id: '',
      promocion_nombre: '',
      estado: estados[estadoIdx],
      reservacion_id: '',
      metodo_pago: metodos[Math.floor(Math.random() * metodos.length)],
      subtotal,
      descuento,
      total,
      cantidad,
      banco: bancos[Math.floor(Math.random() * bancos.length)],
      impuesto,
      cantidad_facturar: total
    });
  }

  // ---- Reservaciones ----
  const reservaciones = [];
  const estadosRes = ['Solicitada', 'Confirmada', 'En espera', 'Atendida', 'Cancelada', 'No asistió'];
  const motivosRes = ['Cumpleaños', 'Reunión de trabajo', 'Cita', 'Estudio grupal', 'Evento privado', 'Casual'];
  const canalesRes = ['Teléfono', 'WhatsApp', 'Instagram', 'Presencial', 'Web'];
  const mesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8', 'Terraza 1', 'Terraza 2', 'VIP 1'];

  for (let i = 0; i < 15; i++) {
    const diasOffset = Math.floor(Math.random() * 14) - 3; // -3 a +10 días
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + diasOffset);
    const hora = `${Math.floor(Math.random() * 10) + 8}:${Math.random() > 0.5 ? '00' : '30'}`;
    const clienteIdx = Math.floor(Math.random() * (clientes.length - 1)); // excluir empresa
    const estadoIdx = diasOffset < 0 ? (Math.random() > 0.2 ? 3 : 5) : (Math.random() > 0.3 ? Math.floor(Math.random() * 3) : 4);

    reservaciones.push({
      id: `r${String(i + 1).padStart(3, '0')}`,
      cliente_id: clientes[clienteIdx].id,
      nombre_cliente: clientes[clienteIdx].nombres,
      fecha: fecha.toISOString().split('T')[0],
      hora,
      num_personas: Math.floor(Math.random() * 8) + 1,
      mesa: mesas[Math.floor(Math.random() * mesas.length)],
      motivo: motivosRes[Math.floor(Math.random() * motivosRes.length)],
      estado: estadosRes[estadoIdx],
      observaciones: '',
      created_at: new Date(fecha.getTime() - 86400000 * 2).toISOString(),
      canal: canalesRes[Math.floor(Math.random() * canalesRes.length)]
    });
  }

  // ---- Promociones ----
  const promociones = [
    { id: 'pr001', nombre: 'Happy Hour', descripcion: '20% de descuento en todos los cafés de 15:00 a 17:00', tipo_promocion: 'Descuento Porcentual', descuento: 20, producto_aplicable: 'Todos los cafés', activa: true },
    { id: 'pr002', nombre: '2x1 Frappés', descripcion: 'Lleva 2 frappés por el precio de 1 los martes', tipo_promocion: '2x1', descuento: 50, producto_aplicable: 'Frappés', activa: true },
    { id: 'pr003', nombre: 'Combo Desayuno', descripcion: 'Desayuno Oveja Negra + Americano por $8.50', tipo_promocion: 'Combo', descuento: 15, producto_aplicable: 'Desayuno + Americano', activa: true },
    { id: 'pr004', nombre: 'Cliente Fiel', descripcion: '10% de descuento para clientes VIP y Fidelizados', tipo_promocion: 'Descuento Porcentual', descuento: 10, producto_aplicable: 'Todo el menú', activa: true },
    { id: 'pr005', nombre: 'Cumpleañero', descripcion: 'Postre gratis en tu cumpleaños', tipo_promocion: 'Producto Gratis', descuento: 100, producto_aplicable: 'Postres', activa: true },
    { id: 'pr006', nombre: 'Fin de Semana Familiar', descripcion: '15% de descuento en pedidos mayores a $15', tipo_promocion: 'Descuento Porcentual', descuento: 15, producto_aplicable: 'Todo el menú', activa: false }
  ];

  // ---- Proveedores ----
  const proveedores = [
    { id: 'pv001', nombre: 'Café de Loja S.A.', ruc: '1190012345001', email: 'ventas@cafedeloja.ec', contacto: '0999876543', ciudad: 'Loja', direccion: 'Zona Industrial Km 3', descuentos: '5% por volumen', estado: 'Entregado', cantidad_producto: 50, fecha: '2026-09-01', total_pagar: 375.00, metodo_pago: 'Transferencia' },
    { id: 'pv002', nombre: 'Lácteos del Valle', ruc: '1891045678001', email: 'pedidos@lacteosv.ec', contacto: '0322567890', ciudad: 'Ambato', direccion: 'Av. Indoamérica Km 2', descuentos: '3% pronto pago', estado: 'Confirmado', cantidad_producto: 30, fecha: '2026-09-05', total_pagar: 120.50, metodo_pago: 'Efectivo' },
    { id: 'pv003', nombre: 'Distribuidora El Azúcar', ruc: '0991234567001', email: 'info@elazucar.com', contacto: '0987654312', ciudad: 'Guayaquil', direccion: 'Mapasingue Este', descuentos: '', estado: 'Pendiente', cantidad_producto: 100, fecha: '2026-09-08', total_pagar: 85.00, metodo_pago: 'Transferencia' },
    { id: 'pv004', nombre: 'EcoPack Empaques', ruc: '1792345678001', email: 'ventas@ecopack.ec', contacto: '0228901234', ciudad: 'Quito', direccion: 'Parque Industrial Turubamba', descuentos: '10% pedidos >500 uds', estado: 'Entregado', cantidad_producto: 500, fecha: '2026-08-28', total_pagar: 225.00, metodo_pago: 'Tarjeta de Crédito' },
    { id: 'pv005', nombre: 'Panadería Artesanal Don Paco', ruc: '1801234567001', email: 'donpaco@email.com', contacto: '0983456780', ciudad: 'Ambato', direccion: 'Ficoa, calle Montalvo', descuentos: '', estado: 'Confirmado', cantidad_producto: 24, fecha: '2026-09-07', total_pagar: 96.00, metodo_pago: 'Efectivo' },
    { id: 'pv006', nombre: 'Importadora Matcha Premium', ruc: '1793456789001', email: 'info@matchapremium.ec', contacto: '0229012345', ciudad: 'Quito', direccion: 'Av. Amazonas N34-56', descuentos: '7% en pedidos mensuales', estado: 'Pendiente', cantidad_producto: 10, fecha: '2026-09-10', total_pagar: 180.00, metodo_pago: 'Transferencia' },
    { id: 'pv007', nombre: 'Frutas Frescas del Oriente', ruc: '1691234567001', email: 'frutas@oriente.ec', contacto: '0987112233', ciudad: 'Puyo', direccion: 'Mercado Central Local 15', descuentos: '', estado: 'Entregado', cantidad_producto: 20, fecha: '2026-09-03', total_pagar: 45.00, metodo_pago: 'Efectivo' },
    { id: 'pv008', nombre: 'Cacao Nacional Fino', ruc: '0792345678001', email: 'ventas@cacaonacional.ec', contacto: '0995678901', ciudad: 'Machala', direccion: 'Av. 25 de Junio', descuentos: '5% compra recurrente', estado: 'Confirmado', cantidad_producto: 15, fecha: '2026-09-06', total_pagar: 210.00, metodo_pago: 'Transferencia' }
  ];

  // ---- Inventario ----
  const inventario = [
    { id: 'i001', nombre: 'Café en grano Arábica', categoria: 'Café', stock_actual: 25, stock_minimo: 10, stock_maximo: 50, costo_unitario: 8.50, total: 212.50, estado: 'Disponible' },
    { id: 'i002', nombre: 'Café en grano Robusta', categoria: 'Café', stock_actual: 8, stock_minimo: 10, stock_maximo: 40, costo_unitario: 6.75, total: 54.00, estado: 'Stock Bajo' },
    { id: 'i003', nombre: 'Leche entera (litro)', categoria: 'Lácteos', stock_actual: 30, stock_minimo: 15, stock_maximo: 60, costo_unitario: 1.20, total: 36.00, estado: 'Disponible' },
    { id: 'i004', nombre: 'Leche de almendras (litro)', categoria: 'Lácteos', stock_actual: 5, stock_minimo: 8, stock_maximo: 25, costo_unitario: 3.50, total: 17.50, estado: 'Stock Bajo' },
    { id: 'i005', nombre: 'Azúcar blanca (kg)', categoria: 'Endulzantes', stock_actual: 20, stock_minimo: 5, stock_maximo: 30, costo_unitario: 1.00, total: 20.00, estado: 'Disponible' },
    { id: 'i006', nombre: 'Stevia (caja 100 sobres)', categoria: 'Endulzantes', stock_actual: 3, stock_minimo: 3, stock_maximo: 15, costo_unitario: 4.50, total: 13.50, estado: 'Stock Bajo' },
    { id: 'i007', nombre: 'Vasos desechables 12oz', categoria: 'Empaques', stock_actual: 200, stock_minimo: 100, stock_maximo: 500, costo_unitario: 0.08, total: 16.00, estado: 'Disponible' },
    { id: 'i008', nombre: 'Tapas para vasos', categoria: 'Empaques', stock_actual: 80, stock_minimo: 100, stock_maximo: 500, costo_unitario: 0.05, total: 4.00, estado: 'Stock Bajo' },
    { id: 'i009', nombre: 'Jarabe de vainilla (750ml)', categoria: 'Jarabes', stock_actual: 6, stock_minimo: 3, stock_maximo: 12, costo_unitario: 9.00, total: 54.00, estado: 'Disponible' },
    { id: 'i010', nombre: 'Jarabe de caramelo (750ml)', categoria: 'Jarabes', stock_actual: 2, stock_minimo: 3, stock_maximo: 12, costo_unitario: 9.00, total: 18.00, estado: 'Stock Bajo' },
    { id: 'i011', nombre: 'Chocolate en polvo (kg)', categoria: 'Ingredientes', stock_actual: 4, stock_minimo: 3, stock_maximo: 10, costo_unitario: 12.00, total: 48.00, estado: 'Disponible' },
    { id: 'i012', nombre: 'Matcha en polvo (200g)', categoria: 'Ingredientes', stock_actual: 2, stock_minimo: 2, stock_maximo: 8, costo_unitario: 18.00, total: 36.00, estado: 'Stock Bajo' },
    { id: 'i013', nombre: 'Crema chantilly (500ml)', categoria: 'Lácteos', stock_actual: 10, stock_minimo: 5, stock_maximo: 20, costo_unitario: 2.80, total: 28.00, estado: 'Disponible' },
    { id: 'i014', nombre: 'Servilletas (paquete 500)', categoria: 'Insumos', stock_actual: 8, stock_minimo: 3, stock_maximo: 15, costo_unitario: 3.00, total: 24.00, estado: 'Disponible' },
    { id: 'i015', nombre: 'Maracuyá fresca (kg)', categoria: 'Frutas', stock_actual: 1, stock_minimo: 3, stock_maximo: 10, costo_unitario: 2.50, total: 2.50, estado: 'Stock Bajo' }
  ];

  // Save all to localStorage
  DB._setTable('clientes', clientes);
  DB._setTable('productos', productos);
  DB._setTable('ventas', ventas);
  DB._setTable('reservaciones', reservaciones);
  DB._setTable('promociones', promociones);
  DB._setTable('proveedores', proveedores);
  DB._setTable('inventario', inventario);
  DB.markSeeded();
  ensureUsersSeeded();
  
  console.log('✅ Datos semilla cargados exitosamente');
}

function migrateSocialMedia() {
  const data = localStorage.getItem('on_clientes');
  if (!data) return;
  try {
    const clientes = JSON.parse(data);
    const valid = ['Facebook', 'Instagram', 'TikTok', 'LinkedIn'];
    let modified = false;
    clientes.forEach((c, i) => {
      if (c.red_social && !valid.includes(c.red_social)) {
        const redes = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn'];
        c.red_social = redes[i % redes.length];
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem('on_clientes', JSON.stringify(clientes));
    }
  } catch (e) {
    console.error('Error migrando redes sociales:', e);
  }
}

function ensureUsersSeeded() {
  const usuarios = DB._getTable('usuarios') || [];
  const defaultUsuarios = [
    {
      id: 'u001',
      nombres: 'Administrador General',
      email: 'admin@ovejanegra.ec',
      password: 'admin123',
      telefono: '0991122334',
      cargo: 'Administrador del Sistema',
      rol: 'Administrador',
      email_verificado: true,
      codigo_verificacion: '',
      aprobado: true,
      estado: 'Aprobado',
      fecha_aprobacion: '2026-09-01T08:00:00.000Z',
      aprobado_por: 'Sistema',
      modulos_permitidos: ['dashboard', 'clientes', 'productos', 'ventas', 'reservaciones', 'promociones', 'proveedores', 'inventario', 'usuarios'],
      created_at: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'u002',
      nombres: 'Mateo Silva',
      email: 'cajero@ovejanegra.ec',
      password: 'cajero123',
      telefono: '0984455667',
      cargo: 'Cajero / Ventas',
      rol: 'Personal',
      email_verificado: true,
      codigo_verificacion: '',
      aprobado: true,
      estado: 'Aprobado',
      fecha_aprobacion: '2026-09-05T09:30:00.000Z',
      aprobado_por: 'Administrador General',
      modulos_permitidos: ['dashboard', 'clientes', 'productos', 'ventas', 'reservaciones'],
      created_at: '2026-09-05T09:00:00.000Z'
    },
    {
      id: 'u003',
      nombres: 'Andrea Morales',
      email: 'barista@ovejanegra.ec',
      password: 'barista123',
      telefono: '0997788990',
      cargo: 'Barista Principal',
      rol: 'Personal',
      email_verificado: true,
      codigo_verificacion: '',
      aprobado: false,
      estado: 'Pendiente',
      fecha_aprobacion: null,
      aprobado_por: null,
      modulos_permitidos: ['productos', 'inventario'],
      created_at: '2026-09-13T14:15:00.000Z'
    },
    {
      id: 'u004',
      nombres: 'Carlos Rivas',
      email: 'mesero@ovejanegra.ec',
      password: 'mesero123',
      telefono: '0981122445',
      cargo: 'Atención y Mesas',
      rol: 'Personal',
      email_verificado: false,
      codigo_verificacion: '739402',
      aprobado: false,
      estado: 'Pendiente',
      fecha_aprobacion: null,
      aprobado_por: null,
      modulos_permitidos: ['reservaciones'],
      created_at: '2026-09-14T06:00:00.000Z'
    }
  ];

  if (usuarios.length === 0) {
    DB._setTable('usuarios', defaultUsuarios);
    console.log('✅ Usuarios semilla inicializados');
  } else {
    // Asegurar que el usuario administrador siempre exista y esté habilitado
    const adminIndex = usuarios.findIndex(u => (u.email || '').toLowerCase() === 'admin@ovejanegra.ec');
    if (adminIndex === -1) {
      usuarios.unshift(defaultUsuarios[0]);
      DB._setTable('usuarios', usuarios);
      console.log('✅ Administrador general restaurado');
    } else {
      const admin = usuarios[adminIndex];
      let updated = false;
      if (admin.rol !== 'Administrador' || !admin.aprobado || !admin.email_verificado || admin.password !== 'admin123') {
        admin.rol = 'Administrador';
        admin.aprobado = true;
        admin.email_verificado = true;
        admin.estado = 'Aprobado';
        admin.password = 'admin123';
        admin.modulos_permitidos = ['dashboard', 'clientes', 'productos', 'ventas', 'reservaciones', 'promociones', 'proveedores', 'inventario', 'usuarios'];
        updated = true;
      }
      if (updated) {
        DB._setTable('usuarios', usuarios);
        console.log('✅ Permisos y credenciales del Administrador verificados y actualizados');
      }
    }
  }
}

