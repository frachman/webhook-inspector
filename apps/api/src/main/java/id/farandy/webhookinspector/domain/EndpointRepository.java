package id.farandy.webhookinspector.domain;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EndpointRepository extends JpaRepository<EndpointEntity, UUID> {
    Optional<EndpointEntity> findByPublicKeyAndExpiresAtAfter(String publicKey, Instant now);
}
