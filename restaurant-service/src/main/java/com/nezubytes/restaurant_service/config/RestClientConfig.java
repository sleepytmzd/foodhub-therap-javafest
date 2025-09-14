package com.nezubytes.restaurant_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import com.nezubytes.restaurant_service.client.QdrantClient;


@Configuration
public class RestClientConfig {
    
    @Value("${qdrant-openai-service.url}")
    private String qdrantServiceUrl;

    @Bean
    public QdrantClient qdrantClient() {
        RestClient restClient = RestClient.builder()
                .baseUrl(qdrantServiceUrl)
                .build();

        var restClientAdapter = RestClientAdapter.create(restClient);
        var httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(restClientAdapter).build();

        return httpServiceProxyFactory.createClient(QdrantClient.class);
    }

     
}
