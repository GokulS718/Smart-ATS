# Stage 1: Build the Spring Boot application using Maven and Temurin JDK 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application skipping unit tests
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime image using Eclipse Temurin JRE 21
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar artifact from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose default Spring Boot web server port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
