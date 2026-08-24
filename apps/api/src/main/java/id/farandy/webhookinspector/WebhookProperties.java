package id.farandy.webhookinspector;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("webhook")
public record WebhookProperties(long defaultTtlHours, int maxBodyBytes) {

    public WebhookProperties {
        if (defaultTtlHours < 1) {
            throw new IllegalArgumentException("webhook.default-ttl-hours must be positive");
        }
        if (maxBodyBytes < 1) {
            throw new IllegalArgumentException("webhook.max-body-bytes must be positive");
        }
    }
}
