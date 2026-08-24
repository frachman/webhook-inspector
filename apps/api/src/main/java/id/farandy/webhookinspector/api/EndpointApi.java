package id.farandy.webhookinspector.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class EndpointApi {

    private EndpointApi() {
    }

    public record CreateEndpointRequest(@Min(1) @Max(168) Integer ttlHours) {
    }

    public record CreateEndpointResponse(
            UUID endpointId,
            String webhookUrl,
            String viewerToken,
            Instant createdAt,
            Instant expiresAt) {
    }

    public record CapturedResponse(UUID requestId, Instant capturedAt) {
    }

    public record RequestSummary(
            UUID id,
            String method,
            String path,
            String rawQuery,
            String contentType,
            int bodySize,
            Instant createdAt) {
    }

    public record RequestDetail(
            UUID id,
            String method,
            String path,
            String rawQuery,
            Map<String, List<String>> headers,
            String bodyBase64,
            String bodyText,
            String contentType,
            int bodySize,
            Instant createdAt,
            Instant expiresAt) {
    }
}
