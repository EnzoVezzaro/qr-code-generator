
### 📅 Nombre del Proyecto

**QR Access Manager**

### 💡 Descripción General

Aplicación web para gestionar eventos con hasta 1000 participantes, generando códigos QR únicos por persona, validando su acceso en el evento mediante escaneo. Cada código QR puede configurarse con una cantidad máxima de usos. Incluye panel de administración, generación de códigos, manejo de check-in en tiempo real y envío manual de correos con plantillas personalizables.

---

### ⚖️ Requerimientos Funcionales

#### 1. Gestión de Eventos

* Crear y editar eventos con:

  * Nombre, fecha y ubicación del evento.
  * Límite máximo de 1000 participantes.
  * **Límite obligatorio de uso por código QR** (ej: 1, 2, 3 usos máximo).
  * Personalización de la página de check-in (logo, color, mensaje).

#### 2. Registro de Participantes

* Registro individual mediante formulario.
* Registro masivo por carga de archivos `.csv` o `.txt`.
* Validación de campos: nombre, email, identificador único (ej: cédula o ID).
* Evitar duplicados por identificador o correo.

#### 3. Generación de QR Codes

* Generación de códigos QR únicos con token seguro por participante.
* QR contiene URL personalizada que lleva a la validación/check-in.
* Descarga en formato PNG y/o SVG.
* Generación separada del envío de correos.

#### 4. Envió Manual de Correos

* Editor de plantillas de correo.
* No se permite enviar correos sin una plantilla guardada.
* Variables soportadas en plantilla: `{nombre}`, `{evento}`, `{qr_link}`.
* Enviar correos:

  * A todos.
  * A seleccionados.
  * Individual.

#### 5. Módulo de Check-in

* Escaneo de QR con cámara desde página web.
* Validación de código:

  * Éxito si QR existe y no ha excedido su límite de uso.
  * Rechazo si ya se usó el máximo de veces o fue revocado.
* Registro del acceso:

  * Fecha/hora.
  * IP y/o información del dispositivo.
* Permitir bloqueo de IPs sospechosas.

#### 6. Panel de Control

* Vista general del evento.
* Estadísticas:

  * Total de registros.
  * Participantes con acceso exitoso.
  * Participantes que no asistieron.
* Exportación de asistencia (CSV).
* Revocación individual o masiva de QR codes.
* Historial de uso de cada código QR.

---

### 🚀 Stack Tecnológico

#### Frontend

* **React** con **shadcn/ui**
* `react-hook-form` para formularios
* `react-qr-reader` o equivalente para escaneo

#### Backend

* **Supabase**

  * Auth (login de administradores y personal de check-in)
  * Base de datos (eventos, participantes, registros de acceso)
  * Edge functions (validación de QR, bloqueo de IPs)
  * Storage (imagenes, plantillas, QR en PNG/SVG)

#### Email

* Integración SMTP de Supabase o servicio externo como **Resend**, **Mailgun**.

#### QR Code

* Librerías: `qrcode.react`, `qrcode-svg`, `qrcode-terminal`

---

### ⛓️ Roles de Usuario

#### Administrador

* Crea eventos
* Importa y gestiona participantes
* Genera y descarga QR codes
* Crea plantillas y envía correos
* Configura la página de check-in
* Visualiza estadísticas

#### Staff de Check-in

* Solo tiene acceso a escanear QR y registrar accesos

---

### 📅 Flujo General del Sistema

1. Admin crea evento y carga participantes.
2. Se generan QR personalizados.
3. Admin crea plantilla y envía correos con QR.
4. Participante llega al evento y muestra su QR.
5. Personal escanea y el sistema valida:

   * Si es válido y dentro del límite: acceso exitoso.
   * Si ya se usó o está revocado: denegado.
6. Admin consulta estadísticas en tiempo real y exporta lista final.

---

### ✅ Validaciones y Seguridad

* Cada QR contiene un token firmado y seguro (JWT, UUID o hash).
* Límite de uso por QR obligatorio.
* Escaneos con IP/logging.
* Posibilidad de bloquear IPs sospechosas.

---

### 📆 Roadmap Sugerido

#### Fase 1

* Login + Panel de Administrador
* Crear evento y registrar participantes manualmente
* Generación de QR codes

#### Fase 2

* Carga por CSV/TXT
* Editor de plantillas de email + envío manual

#### Fase 3

* Módulo de check-in (lector QR + validación + registro)
* Estadísticas en tiempo real + exportación CSV

#### Fase 4

* Personalización de página de check-in
* Bloqueo de IPs + revocación de QR
