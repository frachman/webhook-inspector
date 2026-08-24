package id.farandy.webhookinspector.domain;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface EndpointRepository extends JpaRepository<EndpointEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EndpointEntity> findByPublicKeyAndExpiresAtAfter(String publicKey, Instant now);

    long deleteByExpiresAtBefore(Instant now);
}
