package io.getunleash.sdktester;

import java.util.Map;

public record IsEnabled(String name, boolean enabled, Map<String, String> context) {
}
