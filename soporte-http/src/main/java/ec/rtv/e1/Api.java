package ec.rtv.e1;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.UUID;

@RestControllerAdvice
public class Api {
    public record ErrorBody(String codigo) {}

    public static final class Error extends RuntimeException {
        private final int status;
        public Error(int status, String code) {
            super(code);
            this.status = status;
        }
    }

    public static void validar(Long turnoId, String clave, JsonNode cuerpo, int campos) {
        if (turnoId == null || turnoId <= 0 || clave == null || !clave.matches("[A-Za-z0-9._-]{1,128}")
                || cuerpo == null || !cuerpo.isObject() || cuerpo.size() != campos) {
            throw new Error(400, "SOLICITUD_INVALIDA");
        }
    }

    @ExceptionHandler(Error.class)
    ResponseEntity<ErrorBody> negocio(Error error) {
        return ResponseEntity.status(error.status).body(new ErrorBody(error.getMessage()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorBody> solicitudInvalida() {
        return negocio(new Error(400, "SOLICITUD_INVALIDA"));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ErrorBody> formatoInvalido() {
        return negocio(new Error(415, "FORMATO_NO_SOPORTADO"));
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ErrorBody> persistencia(DataAccessException error) {
        LoggerFactory.getLogger(Api.class).warn("solicitud={} persistencia={}",
                MDC.get("solicitud"), error.getClass().getSimpleName());
        return negocio(new Error(503, "PERSISTENCIA_NO_DISPONIBLE"));
    }

    public static OncePerRequestFilter correlacion(boolean aceptarIdEntrante) {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                    throws ServletException, IOException {
                String id = aceptarIdEntrante ? request.getHeader("X-Request-Id") : null;
                if (id == null || !id.matches("[0-9a-fA-F-]{36}")) {
                    id = UUID.randomUUID().toString();
                }
                MDC.put("solicitud", id);
                response.setHeader("X-Request-Id", id);
                try {
                    chain.doFilter(request, response);
                } finally {
                    LoggerFactory.getLogger(Api.class).info("solicitud={} http={}", id, response.getStatus());
                    MDC.remove("solicitud");
                }
            }
        };
    }
}
