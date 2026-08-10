# config-server

Spring Cloud Config Server, `native` profile (serves config from `classpath:/config`, not a separate git repo). Pure boilerplate today - `ConfigServerApplication` is just `@SpringBootApplication` + `@EnableConfigServer`, no custom classes.

**Port:** 8888

## Run standalone

```bash
mvn -pl config-server -am spring-boot:run
```
