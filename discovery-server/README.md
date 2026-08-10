# discovery-server

Eureka service registry - every other Java service registers here on startup and discovers its peers through it. Pure boilerplate today - `DiscoveryServerApplication` is just `@SpringBootApplication` + `@EnableEurekaServer`, no custom classes. Dashboard at `http://localhost:8761`.

**Port:** 8761

## Run standalone

```bash
mvn -pl discovery-server -am spring-boot:run
```

This is normally the first service to start (everything else depends on it being reachable to register).
