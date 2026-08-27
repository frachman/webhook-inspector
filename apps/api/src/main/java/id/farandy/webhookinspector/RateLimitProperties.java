package id.farandy.webhookinspector;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("rate-limit")
public record RateLimitProperties(
        int apiPerMinute,
        int webhookPerMinute,
        int maxTrackedKeys) {

    public RateLimitProperties {
        if (apiPerMinute < 1 || webhookPerMinute < 1 || maxTrackedKeys < 1) {
            throw new IllegalArgumentException("Rate-limit values must be positive");
        }
    }
}
