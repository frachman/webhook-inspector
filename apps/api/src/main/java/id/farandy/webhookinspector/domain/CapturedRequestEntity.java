package id.farandy.webhookinspector.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "captured_request")
public class CapturedRequestEntity {

    @Id
    private UUID id;

    @Column(name = "endpoint_id", nullable = false, updatable = false)
    private UUID endpointId;

    @Column(nullable = false, updatable = false)
    private String method;

    @Column(nullable = false, updatable = false)
    private String path;

    @Column(name = "raw_query", updatable = false)
    private String rawQuery;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb", updatable = false)
    private Map<String, List<String>> headers;

    @Column(updatable = false)
    private byte[] body;

    @Column(name = "content_type", updatable = false)
    private String contentType;

    @Column(name = "body_size", nullable = false, updatable = false)
    private int bodySize;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    protected CapturedRequestEntity() {
    }

    public CapturedRequestEntity(
            UUID id,
            UUID endpointId,
            String method,
            String path,
            String rawQuery,
            Map<String, List<String>> headers,
            byte[] body,
            String contentType,
            int bodySize,
            Instant createdAt,
            Instant expiresAt) {
        this.id = id;
        this.endpointId = endpointId;
        this.method = method;
        this.path = path;
        this.rawQuery = rawQuery;
        this.headers = headers;
        this.body = body;
        this.contentType = contentType;
        this.bodySize = bodySize;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public UUID getId() { return id; }
    public UUID getEndpointId() { return endpointId; }
    public String getMethod() { return method; }
    public String getPath() { return path; }
    public String getRawQuery() { return rawQuery; }
    public Map<String, List<String>> getHeaders() { return headers; }
    public byte[] getBody() { return body; }
    public String getContentType() { return contentType; }
    public int getBodySize() { return bodySize; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
}
