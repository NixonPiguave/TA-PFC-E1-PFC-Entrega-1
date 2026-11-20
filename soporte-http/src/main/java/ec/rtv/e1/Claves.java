package ec.rtv.e1;

import org.springframework.jdbc.core.JdbcTemplate;

public final class Claves {
    private Claves() {}

    // Se confirma antes de procesar la operación, aunque esta falle posteriormente.
    public static void reservar(JdbcTemplate db, String clave, long turnoId) {
        db.update("insert into claves (clave, turno_id) values (?, ?) on conflict (clave) do nothing",
                clave, turnoId);
        Long existente = db.queryForObject("select turno_id from claves where clave = ?", Long.class, clave);
        if (!Long.valueOf(turnoId).equals(existente)) {
            throw new Api.Error(409, "CLAVE_REUTILIZADA");
        }
    }
}
