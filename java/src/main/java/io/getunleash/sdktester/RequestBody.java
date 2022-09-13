package io.getunleash.sdktester;

import java.util.Map;

record RequestBody (String toggle, Map<String, Object> context) {
}
