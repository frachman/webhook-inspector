package id.farandy.webhookinspector.service;

import id.farandy.webhookinspector.WebhookProperties;
import id.farandy.webhookinspector.api.EndpointApi.CreateEndpointResponse;
import id.farandy.webhookinspector.api.EndpointApi.RequestDetail;
import id.farandy.webhookinspector.api.EndpointApi.RequestSummary;
import id.farandy.webhookinspector.domain.CapturedRequestEntity;
import id.farandy.webhookinspector.domain.CapturedRequestRepository;
import id.farandy.webhookinspector.domain.EndpointEntity;
import id.farandy.webhookinspector.domain.EndpointRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EndpointService {

    private static final int PUBLIC_KEY_BYTES = 24;
    private static final int VIEWER_TOKEN_BYTES = 32;

    private final EndpointRepository endpointRepository;
    private final CapturedRequestRepository requestRepository;
    private final WebhookProperties properties;
    private final UsageMetricsService metrics;
    private final SecureRandom secureRandom = new SecureRandom();
    private final Clock clock = Clock.systemUTC();

    public EndpointService(
            EndpointRepository endpointRepository,
            CapturedRequestRepository requestRepository,
            WebhookProperties properties,
            UsageMetricsService metrics) {
        this.endpointRepository = endpointRepository;
        this.requestRepository = requestRepository;
        this.properties = properties;
        this.metrics = metrics;
    }

    @Transactional
    public CreateEndpointResponse create(Integer requestedTtlHours, String baseUrl) {
        long ttlHours = requestedTtlHours == null ? properties.defaultTtlHours() : requestedTtlHours;
        Instant now = clock.instant();
        String publicKey = randomToken(PUBLIC_KEY_BYTES);
        String viewerToken = randomToken(VIEWER_TOKEN_BYTES);
        EndpointEntity endpoint = new EndpointEntity(
                UUID.randomUUID(),
                publicKey,
                digest(viewerToken),
                now,
                now.plus(Duration.ofHours(ttlHours)));
        endpointRepository.save(endpoint);
        metrics.increment("endpoints_created");

        return new CreateEndpointResponse(
                endpoint.getId(),
                baseUrl + "/w/" + publicKey,
                viewerToken,
                endpoint.getCreatedAt(),
                endpoint.getExpiresAt());
    }

    @Transactional
    public CapturedRequestEntity capture(
            String publicKey,
            String method,
            String path,
            String rawQuery,
            Map<String, List<String>> headers,
            byte[] body,
            String contentType) {
        Instant now = clock.instant();
        EndpointEntity endpoint = endpointRepository.findByPublicKeyAndExpiresAtAfter(publicKey, now)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Endpoint not found or expired"));

        if (requestRepository.countByEndpointId(endpoint.getId()) >= properties.maxRequestsPerEndpoint()) {
            CapturedRequestEntity oldest = requestRepository.findFirstByEndpointIdOrderByCreatedAtAsc(endpoint.getId())
                    .orElseThrow(() -> new IllegalStateException("Endpoint request count is inconsistent"));
            requestRepository.delete(oldest);
        }

        CapturedRequestEntity captured = new CapturedRequestEntity(
                UUID.randomUUID(),
                endpoint.getId(),
                method,
                path,
                rawQuery,
                headers,
                body,
                contentType,
                body.length,
                now,
                endpoint.getExpiresAt());
        CapturedRequestEntity saved = requestRepository.save(captured);
        metrics.increment("webhooks_received");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<RequestSummary> list(UUID endpointId, String viewerToken) {
        EndpointEntity endpoint = authorize(endpointId, viewerToken);
        metrics.increment("endpoint_views");
        return requestRepository.findAllByEndpointIdAndExpiresAtAfterOrderByCreatedAtDesc(endpoint.getId(), clock.instant())
                .stream()
                .map(request -> new RequestSummary(
                        request.getId(),
                        request.getMethod(),
                        request.getPath(),
                        request.getRawQuery(),
                        request.getContentType(),
                        request.getBodySize(),
                        request.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RequestDetail detail(UUID endpointId, UUID requestId, String viewerToken) {
        EndpointEntity endpoint = authorize(endpointId, viewerToken);
        metrics.increment("request_detail_views");
        CapturedRequestEntity request = requestRepository
                .findByIdAndEndpointIdAndExpiresAtAfter(requestId, endpoint.getId(), clock.instant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Captured request not found"));
        return new RequestDetail(
                request.getId(),
                request.getMethod(),
                request.getPath(),
                request.getRawQuery(),
                request.getHeaders(),
                Base64.getEncoder().encodeToString(request.getBody()),
                isTextual(request.getContentType()) ? new String(request.getBody(), StandardCharsets.UTF_8) : null,
                request.getContentType(),
                request.getBodySize(),
                request.getCreatedAt(),
                request.getExpiresAt());
    }

    private EndpointEntity authorize(UUID endpointId, String viewerToken) {
        Instant now = clock.instant();
        EndpointEntity endpoint = endpointRepository.findById(endpointId)
                .filter(candidate -> candidate.getExpiresAt().isAfter(now))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Endpoint not found or expired"));
        if (viewerToken == null || !MessageDigest.isEqual(endpoint.getViewerTokenHash(), digest(viewerToken))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid viewer credential");
        }
        return endpoint;
    }

    private String randomToken(int byteCount) {
        byte[] bytes = new byte[byteCount];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] digest(String token) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private boolean isTextual(String contentType) {
        if (contentType == null) {
            return false;
        }
        String normalized = contentType.toLowerCase(Locale.ROOT);
        return normalized.startsWith("text/")
                || normalized.contains("json")
                || normalized.contains("xml")
                || normalized.contains("x-www-form-urlencoded");
    }
}
