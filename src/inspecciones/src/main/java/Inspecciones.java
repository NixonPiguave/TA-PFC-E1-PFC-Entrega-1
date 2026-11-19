package ec.rtv.e1;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

@RestController
class Inspecciones {
    record Inspeccion(UUID inspeccionId, long turnoId, UUID autorizacionId, String estado) {}

    private static final RowMapper<Inspeccion> LEER = (row, index) -> new Inspeccion(
            row.getObject("id", UUID.class), row.getLong("turno_id"),
            row.getObject("autorizacion_id", UUID.class), "INICIADA");

    private final JdbcTemplate db;
    private final ClienteTurnos turnos;

    Inspecciones(JdbcTemplate db, ClienteTurnos turnos) {
        this.db = db;
        this.turnos = turnos;
    }

    @PostMapping(path = "/inspecciones", consumes = "application/json")
    ResponseEntity<Inspeccion> iniciar(@RequestHeader(value = "Idempotency-Key", required = false) String clave,
            @RequestBody JsonNode cuerpo) {
        JsonNode campoTurno = cuerpo.path("turnoId");
        Long turnoId = campoTurno.isIntegralNumber() && campoTurno.canConvertToLong() ? campoTurno.longValue() : null;
        Api.validar(turnoId, clave, cuerpo, 1);
        Claves.reservar(db, clave, turnoId);
        var existentes = db.query("select * from inspecciones where clave = ?", LEER, clave);
        if (!existentes.isEmpty()) {
            return ResponseEntity.ok(existentes.getFirst());
        }

        UUID autorizacionId = turnos.autorizar(turnoId, clave);
        int insertadas = db.update("""
                insert into inspecciones (id, turno_id, autorizacion_id, clave)
                values (?, ?, ?, ?) on conflict (clave) do nothing
                """, UUID.randomUUID(), turnoId, autorizacionId, clave);
        Inspeccion inspeccion = db.queryForObject("select * from inspecciones where clave = ?", LEER, clave);
        return ResponseEntity.status(insertadas == 1 ? 201 : 200).body(inspeccion);
    }
}
