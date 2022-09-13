package io.getunleash.sdktester;


import io.getunleash.Unleash;
import io.getunleash.UnleashContext;
import io.getunleash.Variant;
import io.getunleash.variant.Payload;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZonedDateTime;
import java.util.Map;

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

    public UnleashContext buildContext(Map<String, Object> params) {
        UnleashContext.Builder builder = UnleashContext.builder()
                .currentTime(ZonedDateTime.now());
        if (params != null) {
            if (params.containsKey("Host")) {
                builder = builder.remoteAddress((String) params.get("Host"));
            }
            if (params.containsKey("userId")) {
                builder = builder.userId((String) params.get("userId"));
            }
            if (params.containsKey("appName")) {
                builder = builder.appName((String) params.get("appName"));
            }
            if (params.containsKey("environment")) {
                builder = builder.environment((String) params.get("environment"));
            }
            if (params.containsKey("remoteAddress")) {
                builder = builder.remoteAddress((String) params.get("remoteAddress"));
            }
            if (params.containsKey("sessionId")) {
                builder = builder.sessionId((String) params.get("sessionId"));
            }
            if (params.containsKey("currentTime")) {
                builder = builder.currentTime(ZonedDateTime.parse((String) params.get("currentTime")));
            }
            if (params.containsKey("currentTime")) {
                builder = builder.currentTime(ZonedDateTime.parse((String) params.get("currentTime")));
            }
            if (params.containsKey("properties")) {
                ((Map<String, String>) params.get("properties")).forEach(builder::addProperty);
            }
        }
        return builder.build();
    }

    @PostMapping("/is-enabled")
    public IsEnabled isEnabled(@RequestBody io.getunleash.sdktester.RequestBody body) {
        String toggle = body.toggle();
        Map<String, Object> requestContext = body.context();
        UnleashContext context = buildContext(requestContext);
        return new IsEnabled(
                toggle,
                unleash.isEnabled(toggle, context),
                requestContext
        );
    }

    @PostMapping("/variant")
    public VariantResponse getVariant(@RequestBody io.getunleash.sdktester.RequestBody body) {
        String toggle = body.toggle();
        Map<String, Object> requestContext = body.context();
        UnleashContext context = buildContext(requestContext);
        Variant variant = unleash.getVariant(toggle, context);
        // workaround to fix unleash.getVariant
        if (!variant.isEnabled()) {
            variant = new Variant(variant.getName(), (Payload) null, variant.isEnabled());
        }
        return new VariantResponse(
                toggle,
                variant,
                requestContext
        );
    }

}
