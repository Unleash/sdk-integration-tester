package io.getunleash.sdktester;


import io.getunleash.Unleash;
import io.getunleash.UnleashContext;
import io.getunleash.Variant;
import org.springframework.http.HttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BiFunction;

@RestController
public class UnleashSdkController {

    private final Unleash unleash;


    public UnleashSdkController(Unleash unleash) {
        this.unleash = unleash;
    }

    @GetMapping(value = {"/", "/ready"})
    public ReadyStatus ready() {
        return new ReadyStatus("ok");
    }

    public UnleashContext buildContext(Map<String, String> params) {
        UnleashContext.Builder builder = UnleashContext.builder()
                .currentTime(ZonedDateTime.now());
        if (params.containsKey("Host")) {
            builder = builder.remoteAddress(params.get("Host"));
        }
        if (params.containsKey("userId")) {
            builder = builder.userId(params.get("userId"));
        }
        if (params.containsKey("appName")) {
            builder = builder.appName(params.get("appName"));
        }
        if (params.containsKey("environment")) {
            builder = builder.environment(params.get("environment"));
        }
        if (params.containsKey("remoteAddress")) {
            builder = builder.remoteAddress(params.get("remoteAddress"));
        }
        if (params.containsKey("sessionId")) {
            builder = builder.sessionId(params.get("sessionId"));
        }
        if (params.containsKey("currentTime")) {
            builder = builder.currentTime(ZonedDateTime.parse(params.get("currentTime")));
        }
        params.forEach(builder::addProperty);
        return builder.build();
    }

    @PostMapping("/is-enabled")
    public IsEnabled isEnabled(@RequestBody String toggle, @RequestBody Map<String, String> requestContext) {
        UnleashContext context = buildContext(requestContext);
        return new IsEnabled(
                toggle,
                unleash.isEnabled(toggle, context),
                requestContext
        );
    }

    @PostMapping("/variant")
    public VariantResponse getVariant(@RequestBody String toggle, @RequestBody Map<String, String> requestContext) {
        UnleashContext context = buildContext(requestContext);
        return new VariantResponse(
                toggle,
                unleash.getVariant(toggle, context),
                requestContext
        );
    }

}
