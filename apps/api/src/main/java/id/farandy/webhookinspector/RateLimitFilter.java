package id.farandy.webhookinspector;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_SECONDS = 60;
    private final RateLimitProperties properties;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitProperties properties) {
        this(properties, Clock.systemUTC());
    }

    RateLimitFilter(RateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String category = category(request);
        if (category == null) {
            chain.doFilter(request, response);
            return;
        }

        int limit = category.equals("webhook") ? properties.webhookPerMinute() : properties.apiPerMinute();
        String key = category + ":" + clientKey(request);
        Window window = windows.computeIfAbsent(key, ignored -> new Window(windowStart()));
        int remaining;
        synchronized (window) {
            Instant now = Instant.now(clock);
            if (now.getEpochSecond() - window.startedAt.getEpochSecond() >= WINDOW_SECONDS) {
                window.startedAt = now;
                window.count.set(0);
            }
            int used = window.count.incrementAndGet();
            remaining = Math.max(0, limit - used);
            if (used > limit) {
                long retryAfter = WINDOW_SECONDS - (now.getEpochSecond() - window.startedAt.getEpochSecond());
                response.setStatus(429);
                response.setHeader("Retry-After", Long.toString(Math.max(1, retryAfter)));
                response.setHeader("X-RateLimit-Limit", Integer.toString(limit));
                response.setHeader("X-RateLimit-Remaining", "0");
                return;
            }
        }

        response.setHeader("X-RateLimit-Limit", Integer.toString(limit));
        response.setHeader("X-RateLimit-Remaining", Integer.toString(remaining));
        evictIfNeeded();
        chain.doFilter(request, response);
    }

    private String category(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.equals("/actuator/health") || path.startsWith("/actuator/health/")) {
            return null;
        }
        if (path.startsWith("/w/")) {
            return "webhook";
        }
        if (path.startsWith("/api/")) {
            return "api";
        }
        return null;
    }

    private String clientKey(HttpServletRequest request) {
        String cloudflare = request.getHeader("CF-Connecting-IP");
        if (cloudflare != null && !cloudflare.isBlank()) {
            return cloudflare.trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private Instant windowStart() {
        return Instant.now(clock);
    }

    private void evictIfNeeded() {
        while (windows.size() > properties.maxTrackedKeys()) {
            String first = windows.keySet().stream().findFirst().orElse(null);
            if (first == null || windows.remove(first) == null) {
                return;
            }
        }
    }

    private static final class Window {
        private Instant startedAt;
        private final AtomicInteger count = new AtomicInteger();

        private Window(Instant startedAt) {
            this.startedAt = startedAt;
        }
    }
}
