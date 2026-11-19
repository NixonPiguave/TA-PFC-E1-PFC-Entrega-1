package ec.rtv.e1;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
class ClienteTurnos {
    private static final Logger LOG = LoggerFactory.getLogger(ClienteTurnos.class);

    private final HttpClient http;
    private final JsonMapper json;
    private final URI url;
    private final String token;
    private final Duration timeout;

    ClienteTurnos(JsonMapper json, @Value("${rtv.turnos-url}") URI url,
            @Value("${rtv.token}") String token, @Value("${rtv.turnos-timeout}") Duration timeout) {
        if (token.isBlank() || timeout.isNegative() || timeout.isZero()) {
            throw new IllegalArgumentException("Configurar RTV_SERVICE_TOKEN y TURNOS_TIMEOUT positivo");
        }
        this.http = HttpClient.newBuilder().connectTimeout(timeout).build();
        this.json = json;
        this.url = url;
        this.token = token;
        this.timeout = timeout;
    }

    UUID autorizar(long turnoId, String clave) {
        String solicitud = MDC.get("solicitud");
        var peticion = HttpRequest.newBuilder(url.resolve("/turnos/" + turnoId + "/autorizaciones-inspeccion"))
                .timeout(timeout)
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .header("Idempotency-Key", clave)
                .header("X-Request-Id", solicitud)
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();

        var respuestaPendiente = http.sendAsync(peticion, HttpResponse.BodyHandlers.ofString());
        HttpResponse<String> respuesta;
        try {
            respuesta = respuestaPendiente.get(timeout.toNanos(), TimeUnit.NANOSECONDS);
        } catch (TimeoutException error) {
            respuestaPendiente.cancel(true);
            throw new Api.Error(504, "TURNOS_TIEMPO_AGOTADO");
        } catch (InterruptedException error) {
            respuestaPendiente.cancel(true);
            Thread.currentThread().interrupt();
            throw new Api.Error(503, "TURNOS_NO_DISPONIBLE");
        } catch (ExecutionException error) {
            if (error.getCause() instanceof HttpTimeoutException) {
                throw new Api.Error(504, "TURNOS_TIEMPO_AGOTADO");
            }
            throw new Api.Error(503, "TURNOS_NO_DISPONIBLE");
        }

        int estado = respuesta.statusCode();
        LOG.info("solicitud={} turnos_http={}", solicitud, estado);
        if (estado >= 500) {
            throw new Api.Error(503, "TURNOS_NO_DISPONIBLE");
        }

        try {
            JsonNode cuerpo = json.readTree(respuesta.body());
            if (cuerpo != null && cuerpo.isObject()) {
                String codigo = cuerpo.path("codigo").asString("");
                if ((estado == 404 && codigo.equals("TURNO_INEXISTENTE"))
                        || (estado == 409 && esConflicto(codigo))) {
                    throw new Api.Error(estado, codigo);
                }
                JsonNode id = cuerpo.path("turnoId");
                JsonNode autorizacion = cuerpo.path("autorizacionId");
                if ((estado == 200 || estado == 201) && id.isIntegralNumber() && id.canConvertToLong()
                        && id.longValue() == turnoId && autorizacion.isString()
                        && autorizacion.stringValue().matches("[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}")) {
                    return UUID.fromString(autorizacion.stringValue());
                }
            }
        } catch (JacksonException error) {
            throw new Api.Error(502, "RESPUESTA_TURNOS_INVALIDA");
        }
        throw new Api.Error(502, "RESPUESTA_TURNOS_INVALIDA");
    }

    private boolean esConflicto(String codigo) {
        return switch (codigo) {
            case "PAGO_NO_CONFIRMADO", "TURNO_NO_HABILITADO", "CLAVE_REUTILIZADA", "TURNO_YA_AUTORIZADO" -> true;
            default -> false;
        };
    }
}
