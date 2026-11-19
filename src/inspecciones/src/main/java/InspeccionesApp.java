package ec.rtv.e1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.OncePerRequestFilter;

@SpringBootApplication
public class InspeccionesApp {
    public static void main(String[] args) {
        SpringApplication.run(InspeccionesApp.class, args);
    }

    @Bean
    OncePerRequestFilter correlacion() {
        return Api.correlacion(false);
    }
}
