package id.farandy.webhookinspector.service;

import id.farandy.webhookinspector.domain.EndpointRepository;
import java.time.Clock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RetentionService {

    private final EndpointRepository endpointRepository;
    private final Clock clock = Clock.systemUTC();

    public RetentionService(EndpointRepository endpointRepository) {
        this.endpointRepository = endpointRepository;
    }

    @Scheduled(fixedDelayString = "${webhook.cleanup-interval}")
    @Transactional
    public long cleanupExpired() {
        return endpointRepository.deleteByExpiresAtBefore(clock.instant());
    }
}
