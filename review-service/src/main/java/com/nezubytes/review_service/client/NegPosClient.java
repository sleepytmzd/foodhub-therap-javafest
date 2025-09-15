package com.nezubytes.review_service.client;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.PostExchange;

public interface  NegPosClient {
    @PostExchange("/analyze-sentiment")
    SentimentResponse analyze_sentiment(@RequestParam String text_input);

    record SentimentResponse(
        String sentiment,
        String confidence,
        String explanation,
        String raw_response
    ) {}
}
