package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class UrlImportAdapter implements RecipeImportAdapter {

    private static final Logger log = LoggerFactory.getLogger(UrlImportAdapter.class);

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public UrlImportAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("User-Agent", USER_AGENT)
                .build();
    }

    @Override
    public RawRecipeDTO parse(String url) {
        URI uri = validateUrl(url);
        String html = fetch(uri);
        dumpToTempFile(uri, html);

        List<JsonNode> ldJsonBlocks = extractLdJsonBlocks(html);
        JsonNode recipeNode = RecipeJsonLdExtractor.findRecipeNode(ldJsonBlocks)
                .orElseThrow(() -> new RecipeImportException(
                        "Could not find recipe data at this URL -- the site may block automated "
                                + "requests, or use a format this importer doesn't support yet."));

        return RecipeJsonLdExtractor.toRawRecipeDto(recipeNode, url);
    }

    private URI validateUrl(String url) {
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new IllegalArgumentException("URL must start with http:// or https://");
            }
            return uri;
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Not a valid URL: " + url);
        }
    }

    private String fetch(URI uri) {
        try {
            return restClient.get().uri(uri).retrieve().body(String.class);
        } catch (HttpStatusCodeException e) {
            // Deliberately don't include e.getMessage() here -- for a non-2xx response it embeds the
            // raw response body (often a large HTML error/challenge page), which would otherwise leak
            // verbatim into the user-facing import error notification.
            throw new RecipeImportException(
                    "Could not fetch " + uri + ": the site returned " + e.getStatusCode().value()
                            + " " + e.getStatusText() + ". It may be blocking automated requests.",
                    e);
        } catch (Exception e) {
            throw new RecipeImportException("Could not fetch " + uri + ": " + e.getMessage(), e);
        }
    }

    private void dumpToTempFile(URI uri, String html) {
        try {
            Path tempFile = Files.createTempFile("recipe-import-", ".html");
            Files.writeString(tempFile, html);
            log.info("Fetched {} -> saved to {}", uri, tempFile);
        } catch (IOException e) {
            log.warn("Could not write fetched HTML from {} to a temp file", uri, e);
        }
    }

    private List<JsonNode> extractLdJsonBlocks(String html) {
        Document document = Jsoup.parse(html);
        List<JsonNode> blocks = new ArrayList<>();
        for (Element script : document.select("script[type=application/ld+json]")) {
            Optional<JsonNode> parsed = parseJson(script.data());
            parsed.ifPresent(blocks::add);
        }
        return blocks;
    }

    private Optional<JsonNode> parseJson(String json) {
        try {
            return Optional.of(objectMapper.readTree(json));
        } catch (JacksonException e) {
            log.debug("Skipping malformed ld+json block", e);
            return Optional.empty();
        }
    }
}
