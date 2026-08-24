package id.farandy.webhookinspector;

import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("webhook")
public record WebhookProperties(
        long defaultTtlHours, int maxBodyBytes, int maxRequestsPerEndpoint, String publicBaseUrl) {

    public WebhookProperties {
        if (defaultTtlHours < 1) {
            throw new IllegalArgumentException("webhook.default-ttl-hours must be positive");
        }
        if (maxBodyBytes < 1) {
            throw new IllegalArgumentException("webhook.max-body-bytes must be positive");
        }
        if (maxRequestsPerEndpoint < 1) {
            throw new IllegalArgumentException("webhook.max-requests-per-endpoint must be positive");
        }

        publicBaseUrl = publicBaseUrl == null ? "" : publicBaseUrl.strip();
        if (!publicBaseUrl.isEmpty()) {
            URI uri = URI.create(publicBaseUrl);
            boolean validHttpOrigin = ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                    && uri.getHost() != null
                    && uri.getRawQuery() == null
                    && uri.getRawFragment() == null
                    && (uri.getRawPath() == null || uri.getRawPath().isEmpty() || "/".equals(uri.getRawPath()));
            if (!validHttpOrigin) {
                throw new IllegalArgumentException("webhook.public-base-url must be an HTTP(S) origin");
            }
            publicBaseUrl = publicBaseUrl.endsWith("/")
                    ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                    : publicBaseUrl;
        }
    }
}
