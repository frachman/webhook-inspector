package id.farandy.webhookinspector.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_endpoint")
public class EndpointEntity {

    @Id
    private UUID id;

    @Column(name = "public_key", nullable = false, unique = true, updatable = false)
    private String publicKey;

    @Column(name = "viewer_token_hash", nullable = false, updatable = false)
    private byte[] viewerTokenHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected EndpointEntity() {
    }

    public EndpointEntity(UUID id, String publicKey, byte[] viewerTokenHash, Instant createdAt, Instant expiresAt) {
        this.id = id;
        this.publicKey = publicKey;
        this.viewerTokenHash = viewerTokenHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public byte[] getViewerTokenHash() {
        return viewerTokenHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
