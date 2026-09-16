package com.rhythmicdevil.menu_planner.recipeimport;

import com.rhythmicdevil.menu_planner.recipeimport.dto.RawRecipeDTO;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// No Spring context, no Testcontainers -- a real (local) HTTP server serving a captured
// fixture page, so the full fetch -> jsoup -> JSON-LD extraction pipeline is exercised
// without depending on the real internet being reachable/stable in CI.
class UrlImportAdapterTest {

    private final UrlImportAdapter adapter = new UrlImportAdapter(new ObjectMapper());

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    private String startServer(String responseBody) throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/recipe", exchange -> {
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        return "http://localhost:" + server.getAddress().getPort() + "/recipe";
    }

    @Test
    void fetchesAndParsesRealPage() throws IOException {
        String html = readFixture("full-page.html");
        String url = startServer(html);

        RawRecipeDTO dto = adapter.parse(url);

        assertThat(dto.name()).isEqualTo("Roasted Tomato Risotto");
        assertThat(dto.sourceUrl()).isEqualTo(url);
        assertThat(dto.servings()).isEqualTo(4);
        assertThat(dto.ingredientLines()).hasSize(12);
        assertThat(dto.instructionLines()).hasSize(6);
    }

    @Test
    void pageWithNoRecipeData_throws() throws IOException {
        String url = startServer("<html><body><p>Just a blog post, no recipe here.</p></body></html>");

        assertThatThrownBy(() -> adapter.parse(url)).isInstanceOf(RecipeImportException.class);
    }

    @Test
    void connectionRefused_throws() throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.start();
        int deadPort = server.getAddress().getPort();
        server.stop(0);
        server = null;

        assertThatThrownBy(() -> adapter.parse("http://localhost:" + deadPort + "/recipe"))
                .isInstanceOf(RecipeImportException.class);
    }

    @Test
    void malformedUrl_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.parse("not a url"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void nonHttpScheme_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.parse("ftp://example.com/recipe"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private String readFixture(String name) throws IOException {
        try (InputStream is = getClass().getResourceAsStream("/import-fixtures/" + name)) {
            if (is == null) {
                throw new IOException("Fixture not found: " + name);
            }
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
