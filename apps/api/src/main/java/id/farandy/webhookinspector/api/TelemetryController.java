package id.farandy.webhookinspector.api;

import id.farandy.webhookinspector.service.UsageMetricsService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final UsageMetricsService metrics;

    public TelemetryController(UsageMetricsService metrics) {
        this.metrics = metrics;
    }

    @PostMapping("/page-view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pageView(@RequestBody Map<String, Object> body) {
        if (body.size() != 1 || !"landing".equals(body.get("source"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid telemetry payload");
        }
        metrics.increment("landing_views");
    }
}
