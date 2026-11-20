package ec.rtv.e1;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

@RestController
class Autorizaciones {
    record Autorizacion(UUID autorizacionId, long turnoId) {}

    private final JdbcTemplate db;
    private final TransactionTemplate transaccion;
    private final byte[] credencial;

    Autorizaciones(JdbcTemplate db, TransactionTemplate transaccion, @Value("${rtv.token}") String token) {
        if (token.isBlank()) {
            throw new IllegalArgumentException("RTV_SERVICE_TOKEN debe tener un valor");
        }
        this.db = db;
        this.transaccion = transaccion;
        this.credencial = ("Bearer " + token).getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping(path = "/turnos/{id}/autorizaciones-inspeccion", consumes = "application/json")
    ResponseEntity<Autorizacion> autorizar(@PathVariable long id,
            @RequestHeader(value = "Authorization", required = false) String autorizacion,
            @RequestHeader(value = "Idempotency-Key", required = false) String clave,
            @RequestBody JsonNode cuerpo) {
        if (autorizacion == null || !MessageDigest.isEqual(credencial, autorizacion.getBytes(StandardCharsets.UTF_8))) {
            throw new Api.Error(401, "CREDENCIAL_INVALIDA");
        }
        Api.validar(id, clave, cuerpo, 0);
        Claves.reservar(db, clave, id);
        return transaccion.execute(status -> autorizarTurno(id, clave));
    }

    private ResponseEntity<Autorizacion> autorizarTurno(long id, String clave) {
        var turnos = db.query("select habilitado from turnos where id = ? for update",
                (row, index) -> row.getBoolean(1), id);
        if (turnos.isEmpty()) {
            throw new Api.Error(404, "TURNO_INEXISTENTE");
        }
        var existentes = db.query("select id, clave from autorizaciones where turno_id = ?", (row, index) -> {
            if (!clave.equals(row.getString("clave"))) {
                throw new Api.Error(409, "TURNO_YA_AUTORIZADO");
            }
            return new Autorizacion(row.getObject("id", UUID.class), id);
        }, id);
        if (!existentes.isEmpty()) {
            return ResponseEntity.ok(existentes.getFirst());
        }

        var pagos = db.query("select confirmado from pagos where turno_id = ? for update",
                (row, index) -> row.getBoolean(1), id);
        if (pagos.isEmpty() || !pagos.getFirst()) {
            throw new Api.Error(409, "PAGO_NO_CONFIRMADO");
        }
        if (!turnos.getFirst()) {
            throw new Api.Error(409, "TURNO_NO_HABILITADO");
        }

        UUID autorizacionId = UUID.randomUUID();
        db.update("insert into autorizaciones (id, turno_id, clave) values (?, ?, ?)", autorizacionId, id, clave);
        return ResponseEntity.status(201).body(new Autorizacion(autorizacionId, id));
    }
}
