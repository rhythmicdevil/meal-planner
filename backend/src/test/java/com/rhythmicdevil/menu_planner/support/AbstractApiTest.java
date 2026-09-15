package com.rhythmicdevil.menu_planner.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;

@AutoConfigureMockMvc
public abstract class AbstractApiTest extends AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Value("${app.security.username}")
    private String username;

    @Value("${app.security.password}")
    private String password;

    protected MockHttpServletRequestBuilder authenticated(MockHttpServletRequestBuilder request) {
        return request.with(httpBasic(username, password));
    }
}
