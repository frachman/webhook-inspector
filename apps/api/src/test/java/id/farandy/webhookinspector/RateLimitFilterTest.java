package id.farandy.webhookinspector;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    @Test
    void limitsApiRequestsAndResetsAfterTheWindow() throws Exception {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-27T00:00:00Z"));
        RateLimitFilter filter = new RateLimitFilter(new RateLimitProperties(2, 3, 10), clock);

        assertThat(run(filter, "/api/endpoints").getStatus()).isEqualTo(200);
        assertThat(run(filter, "/api/endpoints").getStatus()).isEqualTo(200);
        MockHttpServletResponse rejected = run(filter, "/api/endpoints");
        assertThat(rejected.getStatus()).isEqualTo(429);
        assertThat(rejected.getHeader("Retry-After")).isEqualTo("60");

        clock.advanceSeconds(60);
        assertThat(run(filter, "/api/endpoints").getStatus()).isEqualTo(200);
    }

    private MockHttpServletResponse run(RateLimitFilter filter, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advanceSeconds(long seconds) {
            instant = instant.plusSeconds(seconds);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
