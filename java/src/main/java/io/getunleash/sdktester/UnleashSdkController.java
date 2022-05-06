package io.getunleash.sdktester;


import io.getunleash.Unleash;
import io.getunleash.UnleashContext;
import io.getunleash.Variant;
import org.springframework.http.HttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/is-enabled/{toggle}")
    public IsEnabled isEnabled(@PathVariable("toggle") String toggleName, @RequestParam Map<String, String> params, @RequestHeader Map<String, String> headers) {
        HashMap<String, String> requestContext = new HashMap<>();
        requestContext.putAll(headers);
        requestContext.putAll(params);
        UnleashContext context = buildContext(requestContext);
        return new IsEnabled(
                toggleName,
                unleash.isEnabled(toggleName, context),
                params
        );
    }

    @GetMapping("/variant/{toggle}")
    public VariantResponse getVariant(@PathVariable("toggle") String toggleName, @RequestParam Map<String, String> params, @RequestHeader Map<String, String> headers) {
        HashMap<String, String> requestContext = new HashMap<>();
        requestContext.putAll(headers);
        requestContext.putAll(params);
        UnleashContext context = buildContext(requestContext);
        Variant v = unleash.getVariant(toggleName, context);
        return new VariantResponse(
                toggleName,
                v
        );
    }

}
