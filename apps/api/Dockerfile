FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY apps/api/pom.xml apps/api/pom.xml
RUN mvn --batch-mode --file apps/api/pom.xml dependency:go-offline

COPY apps/api apps/api
RUN mvn --batch-mode --file apps/api/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre

RUN apt-get update \
    && apt-get install --no-install-recommends --yes wget \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 --create-home appuser
WORKDIR /app
COPY --from=build /workspace/apps/api/target/*.jar app.jar
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
