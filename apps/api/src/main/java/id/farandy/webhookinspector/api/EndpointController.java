package id.farandy.webhookinspector.api;

import static id.farandy.webhookinspector.api.EndpointApi.CreateEndpointRequest;
import static id.farandy.webhookinspector.api.EndpointApi.CreateEndpointResponse;
import static id.farandy.webhookinspector.api.EndpointApi.RequestDetail;
import static id.farandy.webhookinspector.api.EndpointApi.RequestSummary;

import id.farandy.webhookinspector.service.EndpointService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/endpoints")
public class EndpointController {

    private final EndpointService endpointService;

    public EndpointController(EndpointService endpointService) {
        this.endpointService = endpointService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public CreateEndpointResponse create(@Valid @RequestBody CreateEndpointRequest request) {
        String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        return endpointService.create(request.ttlHours(), baseUrl);
    }

    @GetMapping("/{endpointId}/requests")
    public List<RequestSummary> list(
            @PathVariable UUID endpointId,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return endpointService.list(endpointId, bearerToken(authorization));
    }

    @GetMapping("/{endpointId}/requests/{requestId}")
    public RequestDetail detail(
            @PathVariable UUID endpointId,
            @PathVariable UUID requestId,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return endpointService.detail(endpointId, requestId, bearerToken(authorization));
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        return authorization.substring("Bearer ".length());
    }
}
