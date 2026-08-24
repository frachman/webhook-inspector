package id.farandy.webhookinspector;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(WebhookProperties.class)
public class WebhookInspectorApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebhookInspectorApplication.class, args);
    }
}
