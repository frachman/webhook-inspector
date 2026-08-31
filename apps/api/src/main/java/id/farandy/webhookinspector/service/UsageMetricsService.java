package id.farandy.webhookinspector.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsageMetricsService {

    private static final Map<String, String> COLUMNS = Map.of(
            "landing_views", "landing_views",
            "endpoints_created", "endpoints_created",
            "webhooks_received", "webhooks_received",
            "endpoint_views", "endpoint_views",
            "request_detail_views", "request_detail_views",
            "rate_limited_requests", "rate_limited_requests");

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock = Clock.systemUTC();
    private final ConcurrentHashMap<String, LongAdder> pending = new ConcurrentHashMap<>();

    public UsageMetricsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void increment(String event) {
        if (!COLUMNS.containsKey(event)) {
            throw new IllegalArgumentException("Unknown usage event: " + event);
        }
        pending.computeIfAbsent(event, ignored -> new LongAdder()).increment();
    }

    @Scheduled(fixedDelayString = "${usage.flush-interval-ms:60000}")
    @Transactional
    public void flush() {
        Map<String, Long> snapshot = new java.util.HashMap<>();
        pending.forEach((event, counter) -> {
            long value = counter.sumThenReset();
            if (value > 0) {
                snapshot.put(event, value);
            }
        });

        LocalDate date = LocalDate.now(clock);
        try {
            for (Map.Entry<String, Long> entry : snapshot.entrySet()) {
                String column = COLUMNS.get(entry.getKey());
                jdbcTemplate.update("INSERT INTO usage_daily (event_date, " + column
                                + ") VALUES (?, ?) ON CONFLICT (event_date) DO UPDATE SET "
                                + column + " = usage_daily." + column + " + ?", date, entry.getValue(),
                        entry.getValue());
            }
        } catch (RuntimeException exception) {
            snapshot.forEach((event, value) -> pending.computeIfAbsent(event, ignored -> new LongAdder()).add(value));
            throw exception;
        }
    }
}
