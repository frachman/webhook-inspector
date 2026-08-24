package id.farandy.webhookinspector;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import id.farandy.webhookinspector.domain.CapturedRequestEntity;
import id.farandy.webhookinspector.domain.CapturedRequestRepository;
import id.farandy.webhookinspector.domain.EndpointEntity;
import id.farandy.webhookinspector.domain.EndpointRepository;
import id.farandy.webhookinspector.service.RetentionService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@Testcontainers
class WebhookVerticalSliceIntegrationTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("webhook.max-requests-per-endpoint", () -> 2);
        registry.add("webhook.public-base-url", () -> "https://hookbin.example.test");
    }

    @Autowired
    WebApplicationContext context;

    @Autowired
    CapturedRequestRepository capturedRequestRepository;

    @Autowired
    EndpointRepository endpointRepository;

    @Autowired
    RetentionService retentionService;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        capturedRequestRepository.deleteAll();
        endpointRepository.deleteAll();
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void createsCapturesPersistsAndRetrievesAWebhook() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/endpoints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpointId").isNotEmpty())
                .andExpect(jsonPath("$.viewerToken").isNotEmpty())
                .andExpect(jsonPath("$.webhookUrl").isNotEmpty())
                .andReturn();

        String createJson = createResult.getResponse().getContentAsString();
        String endpointId = JsonPath.read(createJson, "$.endpointId");
        String viewerToken = JsonPath.read(createJson, "$.viewerToken");
        String webhookUrl = JsonPath.read(createJson, "$.webhookUrl");
        org.assertj.core.api.Assertions.assertThat(webhookUrl).startsWith("https://hookbin.example.test/w/");
        String publicPath = webhookUrl.substring(webhookUrl.indexOf("/w/"));

        MvcResult captureResult = mockMvc.perform(post(publicPath + "?source=integration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Webhook-Signature", "test-signature")
                        .content("{\"hello\":\"world\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.requestId").isNotEmpty())
                .andReturn();

        String requestId = JsonPath.read(captureResult.getResponse().getContentAsString(), "$.requestId");

        mockMvc.perform(get("/api/endpoints/{endpointId}/requests", endpointId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(requestId))
                .andExpect(jsonPath("$[0].method").value("POST"))
                .andExpect(jsonPath("$[0].rawQuery").value("source=integration"))
                .andExpect(jsonPath("$[0].bodySize").value(17));

        mockMvc.perform(get("/api/endpoints/{endpointId}/requests/{requestId}", endpointId, requestId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headers['x-webhook-signature'][0]").value("test-signature"))
                .andExpect(jsonPath("$.bodyText").value("{\"hello\":\"world\"}"));
    }

    @Test
    void rejectsInvalidViewerCredentials() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/endpoints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andReturn();
        String endpointId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.endpointId");

        mockMvc.perform(get("/api/endpoints/{endpointId}/requests", endpointId)
                        .header("Authorization", "Bearer wrong-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsBodiesAboveTheConfiguredLimit() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/endpoints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andReturn();
        String webhookUrl = JsonPath.read(createResult.getResponse().getContentAsString(), "$.webhookUrl");
        String publicPath = webhookUrl.substring(webhookUrl.indexOf("/w/"));

        mockMvc.perform(post(publicPath)
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .content(new byte[262_145]))
                .andExpect(status().isContentTooLarge());
    }

    @Test
    void retainsOnlyTheConfiguredNumberOfRequestsPerEndpoint() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/endpoints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andReturn();
        String createJson = createResult.getResponse().getContentAsString();
        String endpointId = JsonPath.read(createJson, "$.endpointId");
        String viewerToken = JsonPath.read(createJson, "$.viewerToken");
        String webhookUrl = JsonPath.read(createJson, "$.webhookUrl");
        String publicPath = webhookUrl.substring(webhookUrl.indexOf("/w/"));

        String firstId = capture(publicPath, "first");
        String secondId = capture(publicPath, "second");
        String thirdId = capture(publicPath, "third");

        mockMvc.perform(get("/api/endpoints/{endpointId}/requests", endpointId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[?(@.id == '" + secondId + "')]").exists())
                .andExpect(jsonPath("$[?(@.id == '" + thirdId + "')]").exists());

        mockMvc.perform(get("/api/endpoints/{endpointId}/requests/{requestId}", endpointId, firstId)
                        .header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void capturesEverySupportedWebhookMethod() throws Exception {
        for (HttpMethod method : List.of(HttpMethod.GET, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE)) {
            MvcResult createResult = mockMvc.perform(post("/api/endpoints")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andReturn();
            String webhookUrl = JsonPath.read(createResult.getResponse().getContentAsString(), "$.webhookUrl");
            String publicPath = webhookUrl.substring(webhookUrl.indexOf("/w/"));

            mockMvc.perform(request(method, publicPath)
                            .contentType(MediaType.TEXT_PLAIN)
                            .content(method.name()))
                    .andExpect(status().isAccepted());
        }

        org.assertj.core.api.Assertions.assertThat(capturedRequestRepository.findAll())
                .extracting(CapturedRequestEntity::getMethod)
                .containsExactlyInAnyOrder("GET", "PUT", "PATCH", "DELETE");
    }

    @Test
    void removesExpiredEndpointsAndTheirCapturedRequests() {
        Instant expiredAt = Instant.now().minusSeconds(60);
        UUID endpointId = UUID.randomUUID();
        endpointRepository.save(new EndpointEntity(
                endpointId,
                "expired-key",
                new byte[32],
                expiredAt.minusSeconds(60),
                expiredAt));
        UUID requestId = UUID.randomUUID();
        capturedRequestRepository.save(new CapturedRequestEntity(
                requestId,
                endpointId,
                "POST",
                "/w/expired-key",
                null,
                Map.of(),
                new byte[0],
                null,
                0,
                expiredAt.minusSeconds(30),
                expiredAt));

        retentionService.cleanupExpired();

        org.assertj.core.api.Assertions.assertThat(endpointRepository.existsById(endpointId)).isFalse();
        org.assertj.core.api.Assertions.assertThat(capturedRequestRepository.existsById(requestId)).isFalse();
    }

    private String capture(String publicPath, String value) throws Exception {
        MvcResult result = mockMvc.perform(post(publicPath)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content(value))
                .andExpect(status().isAccepted())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.requestId");
    }
}
