package id.farandy.webhookinspector.api;

import id.farandy.webhookinspector.WebhookProperties;
import id.farandy.webhookinspector.api.EndpointApi.CapturedResponse;
import id.farandy.webhookinspector.domain.CapturedRequestEntity;
import id.farandy.webhookinspector.service.EndpointService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class WebhookController {

    private final EndpointService endpointService;
    private final WebhookProperties properties;

    public WebhookController(EndpointService endpointService, WebhookProperties properties) {
        this.endpointService = endpointService;
        this.properties = properties;
    }

    @RequestMapping(
            value = "/w/{publicKey}",
            method = {
                RequestMethod.GET,
                RequestMethod.POST,
                RequestMethod.PUT,
                RequestMethod.PATCH,
                RequestMethod.DELETE
            })
    @ResponseStatus(HttpStatus.ACCEPTED)
    public CapturedResponse capture(@PathVariable String publicKey, HttpServletRequest request) throws IOException {
        if (request.getContentLengthLong() > properties.maxBodyBytes()) {
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "Request body exceeds configured limit");
        }

        byte[] body = request.getInputStream().readNBytes(properties.maxBodyBytes() + 1);
        if (body.length > properties.maxBodyBytes()) {
            throw new ResponseStatusException(HttpStatus.CONTENT_TOO_LARGE, "Request body exceeds configured limit");
        }

        CapturedRequestEntity captured = endpointService.capture(
                publicKey,
                request.getMethod(),
                request.getRequestURI(),
                request.getQueryString(),
                headers(request),
                body,
                request.getContentType());
        return new CapturedResponse(captured.getId(), captured.getCreatedAt());
    }

    private Map<String, List<String>> headers(HttpServletRequest request) {
        Map<String, List<String>> headers = new LinkedHashMap<>();
        for (String name : Collections.list(request.getHeaderNames())) {
            headers.put(name.toLowerCase(Locale.ROOT), new ArrayList<>(Collections.list(request.getHeaders(name))));
        }
        return headers;
    }
}
