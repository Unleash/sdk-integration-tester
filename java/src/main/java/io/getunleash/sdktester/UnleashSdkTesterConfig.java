package io.getunleash.sdktester;


import io.getunleash.DefaultUnleash;
import io.getunleash.Unleash;
import io.getunleash.util.UnleashConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;


@SpringBootApplication
public class UnleashSdkTesterConfig {


    @Value("${unleash.url}")
    public String unleashUrl;

    @Value("${unleash.api.key}")
    public String unleashApiKey;

    @Bean
    public UnleashConfig unleashConfig() {
        return UnleashConfig.builder()
                .appName("sdk-tester-java")
                .unleashAPI(unleashUrl)
                .customHttpHeader("Authorization", unleashApiKey)
                .synchronousFetchOnInitialisation(true)
                .fetchTogglesInterval(1)
                .build();
    }

    @Bean
    @Scope(scopeName = "singleton")
    public Unleash unleash(UnleashConfig config) {
        return new DefaultUnleash(config);
    }
}
