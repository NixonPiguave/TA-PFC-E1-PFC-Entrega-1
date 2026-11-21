# Contrato REST: autorización para iniciar una inspección

**Proyecto:** Sistema de Revisión Técnica Vehicular (RTV).  
**Actividad:** TA-PFC-E1.  
**Versión:** 0.2.  
**Estado:** Acordado para el esqueleto E1, 20 de noviembre de 2026.  
**Responsables:** Kevin García — arquitectura; Diego Giraldo — desarrollo.

## 1. Flujo y responsabilidades

Inspecciones solicita una autorización a Turnos y Pagos antes de registrar un nuevo inicio. Turnos y Pagos comprueba el turno, su habilitación y el pago confirmado, y guarda la autorización en su propia base. Inspecciones recibe esa autorización y guarda el inicio en su base.

La operación consulta el pago registrado; no realiza un cobro ni convierte un pago pendiente en confirmado.

Los dos servicios utilizan Java y Spring Boot, REST con HTTP/JSON y bases PostgreSQL separadas. Cada servicio accede a sus propios datos y credenciales. HTTP se utiliza en la demostración local; un despliegue externo requiere HTTPS.

## 2. Solicitud entre servicios

**Consumidor:** Inspecciones.  
**Proveedor:** Turnos y Pagos.  
**Método y ruta:** `POST /turnos/{turnoId}/autorizaciones-inspeccion`.

Se utiliza POST porque se crea una autorización persistente.

| Dato | Formato |
| --- | --- |
| `turnoId` | Entero positivo de 64 bits, en la ruta. |
| `Content-Type` | `application/json`. |
| `Idempotency-Key` | Clave de 1 a 128 caracteres: letras ASCII, números, punto, guion y guion bajo. |
| `Authorization` | `Bearer <credencial-del-servicio>`, configurada mediante `RTV_SERVICE_TOKEN`. |
| `X-Request-Id` | Identificador de correlación que Inspecciones envía para relacionar los registros de ambos servicios. |
| Cuerpo | Objeto JSON vacío: `{}`. |

La clave identifica una operación y se conserva en los reintentos. Puede utilizarse un UUID, pero no es el único formato admitido.

Ejemplo con identificadores ficticios:

```http
POST /turnos/123/autorizaciones-inspeccion
Content-Type: application/json
Accept: application/json
Idempotency-Key: 6d243573-882e-4f8e-b858-a801391e5d91
Authorization: Bearer <credencial-del-servicio>

{}
```

## 3. Validaciones y persistencia

El proveedor comprueba la credencial, el identificador del turno, la clave y el cuerpo JSON. Reserva la asociación entre clave y turno y, dentro de la transacción de autorización, comprueba el turno, el pago y la habilitación.

La autorización de un turno ya existente se recupera cuando la clave coincide. Otra clave para ese turno se rechaza. Las restricciones de unicidad y el bloqueo del turno protegen la operación ante solicitudes simultáneas.

En E1 se permite una sola autorización y una sola inspección por turno. Las reinspecciones y la revocación de autorizaciones requieren reglas adicionales.

## 4. Respuesta de Turnos y Pagos

Una autorización nueva devuelve `201 Created`. La repetición de una operación ya completada, con la misma clave y el mismo turno, devuelve `200 OK` con los mismos identificadores.

```json
{
  "autorizacionId": "d747ef3b-ef2d-4c55-8b87-f4a91ac01234",
  "turnoId": 123
}
```

| Campo | Tipo y significado |
| --- | --- |
| `autorizacionId` | UUID representado como texto; identifica la autorización guardada. |
| `turnoId` | Entero positivo; identifica el turno autorizado. |

Esta es la respuesta mínima acordada para E1. La comprobación del pago corresponde al proveedor y ocurre antes de crear la autorización.

## 5. Errores del proveedor

Los errores de negocio y validación tienen un único campo `codigo`:

```json
{
  "codigo": "PAGO_NO_CONFIRMADO"
}
```

| HTTP | Código | Significado |
| --- | --- | --- |
| `400` | `SOLICITUD_INVALIDA` | Identificador, clave o cuerpo JSON inválidos. |
| `401` | `CREDENCIAL_INVALIDA` | Credencial del servicio ausente o incorrecta. |
| `404` | `TURNO_INEXISTENTE` | El turno no existe. |
| `409` | `PAGO_NO_CONFIRMADO` | El pago no está confirmado. |
| `409` | `TURNO_NO_HABILITADO` | El turno no permite iniciar la inspección. |
| `409` | `TURNO_YA_AUTORIZADO` | Otra clave ya produjo una autorización para ese turno. |
| `409` | `CLAVE_REUTILIZADA` | La clave está asociada a otro turno. |
| `415` | `FORMATO_NO_SOPORTADO` | El tipo de contenido no es compatible con la operación. |
| `503` | `PERSISTENCIA_NO_DISPONIBLE` | Falló el acceso a la base de datos. |

Los errores no incluyen consultas SQL, contraseñas ni detalles internos.

## 6. Idempotencia y recuperación

Inspecciones conserva la clave antes de llamar al proveedor. Ambos servicios mantienen su asociación al turno aunque falle un paso posterior. Un reintento debe usar esa clave y ese turno; una operación diferente utiliza otra clave.

| Situación | Comportamiento |
| --- | --- |
| Misma clave y mismo turno con autorización existente | Devolver la autorización original con `200`. |
| Misma clave y otro turno | Rechazar con `409 CLAVE_REUTILIZADA`. |
| Otra clave para un turno autorizado | Rechazar con `409 TURNO_YA_AUTORIZADO`. |
| Peticiones simultáneas | Conservar una sola autorización y una sola inspección por turno. |
| Autorización guardada y fallo antes del registro local | Recuperar la misma autorización y completar la inspección con la clave original. |

Las escrituras de los dos servicios son transacciones locales independientes. Puede existir temporalmente una autorización sin inspección registrada. Un nuevo inicio se confirma después de guardar la inspección vinculada.

## 7. Registro de Inspecciones

El cliente llama a `POST /inspecciones`, con `Content-Type: application/json`, la cabecera `Idempotency-Key` y este cuerpo:

```json
{
  "turnoId": 123
}
```

Inspecciones guarda su UUID, el turno, el UUID de autorización y la clave. Devuelve `201` al crear el registro o `200` al recuperar el existente:

```json
{
  "inspeccionId": "b4fd4b48-f219-4f14-b44a-7cc8e1956789",
  "turnoId": 123,
  "autorizacionId": "d747ef3b-ef2d-4c55-8b87-f4a91ac01234",
  "estado": "INICIADA"
}
```

Los identificadores del ejemplo son ficticios. La credencial Bearer descrita en este contrato protege la llamada entre los servicios.

## 8. Fallos de comunicación

La llamada utiliza `TURNOS_TIMEOUT`, configurado inicialmente en `3s`. Es el límite de espera del consumidor, no una garantía de rendimiento del proveedor.

| Respuesta de Inspecciones | Situación |
| --- | --- |
| `503 TURNOS_NO_DISPONIBLE` | No se puede completar la comunicación o el proveedor devuelve un error del servidor. |
| `504 TURNOS_TIEMPO_AGOTADO` | Se agota el tiempo de espera. |
| `502 RESPUESTA_TURNOS_INVALIDA` | La respuesta no tiene el formato, código o identificadores esperados. |
| `503 PERSISTENCIA_NO_DISPONIBLE` | Falla la persistencia local de Inspecciones. |

Los rechazos conocidos `404` y `409` del proveedor se conservan al responder al cliente. Los demás errores recibidos se tratan según la validación del cliente HTTP; no se presupone que todos se propaguen con el mismo código.

Una respuesta perdida no significa que la autorización no se haya guardado. Inspecciones conserva la clave y permite reintentar de forma explícita. No confirma un nuevo inicio sin autorización válida ni modifica el pago.

## 9. Verificación

Las pruebas de integración cubren el inicio válido, los rechazos, los reintentos, la concurrencia, las credenciales, el reinicio de aplicaciones y la recuperación después de un fallo de comunicación o escritura.

Los diez casos ejecutados se describen en [la revisión del esqueleto](../arquitectura/revision-esqueleto.md), junto con [el registro de resultados](../arquitectura/resultado-integracion-kevin.txt). La tabla de diferencias de esa revisión corresponde a la comparación con la versión 0.1.
