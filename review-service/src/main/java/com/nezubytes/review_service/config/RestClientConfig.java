package com.nezubytes.review_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import com.nezubytes.review_service.client.NegPosClient;

@Configuration
public class RestClientConfig {
    
    @Value("${negative-positive-agent-service.url}")
    private String negposUrl;


    @Bean
    public NegPosClient negplosClient() {
        RestClient restClient = RestClient.builder()
                .baseUrl(negposUrl)
                .build();

        var restClientAdapter = RestClientAdapter.create(restClient);
        var httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(restClientAdapter).build();

        return httpServiceProxyFactory.createClient(NegPosClient.class);
    }
}
