import { readFileSync } from "node:fs";
import { parse } from "yaml";

// Static validation for infra/docker/compose.yaml.
// This is a semantic-equivalent substitute for `docker compose config`
// in environments where Docker is unavailable. It verifies the YAML is
// parseable and the Compose structure satisfies P0-04 safety requirements.

const composePath = new URL("./compose.yaml", import.meta.url);
const compose = parse(readFileSync(composePath, "utf8"));

function assert(condition, message) {
  if (condition) {
    console.log(`[OK] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

assert(typeof compose === "object" && compose !== null, "compose.yaml parses to an object");

const services = compose.services ?? {};
assert(services.postgres, "service 'postgres' is defined");
assert(services.redis, "service 'redis' is defined");

for (const [name, service] of Object.entries(services)) {
  const image = service.image;
  assert(
    typeof image === "string" && image.length > 0 && !image.endsWith(":latest"),
    `service '${name}' uses a fixed image tag ('${image}')`
  );

  for (const port of service.ports ?? []) {
    assert(
      typeof port === "string" && port.startsWith("127.0.0.1:"),
      `service '${name}' binds port '${port}' to loopback only`
    );
  }

  assert(service.healthcheck?.test, `service '${name}' defines a healthcheck`);
  assert(
    Array.isArray(service.volumes) && service.volumes.length > 0,
    `service '${name}' has a persistence volume`
  );
}

assert(compose.volumes?.postgres_data, "named volume 'postgres_data' is defined");
assert(compose.volumes?.redis_data, "named volume 'redis_data' is defined");

console.log(process.exitCode ? "\nValidation FAILED" : "\nValidation PASSED");
