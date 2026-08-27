package id.farandy.webhookinspector;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties({WebhookProperties.class, RateLimitProperties.class})
@EnableScheduling
public class WebhookInspectorApplication {

    @Bean
    RateLimitFilter rateLimitFilter(RateLimitProperties properties) {
        return new RateLimitFilter(properties);
    }

    @Bean
    FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(1);
        return registration;
    }

    public static void main(String[] args) {
        SpringApplication.run(WebhookInspectorApplication.class, args);
    }
}
