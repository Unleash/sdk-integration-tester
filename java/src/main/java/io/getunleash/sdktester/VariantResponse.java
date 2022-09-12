package io.getunleash.sdktester;

import io.getunleash.Variant;
import java.util.Map;

public record VariantResponse(String name, Variant variant, Map<String, String> context) {
}
