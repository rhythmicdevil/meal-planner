package com.rhythmicdevil.menu_planner.backup;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

/**
 * Full-database export/import via the real mysqldump/mysql client binaries (installed in the
 * backend's runtime image -- see Dockerfile) rather than a hand-rolled JPA-based export. A
 * mysqldump already emits "DROP TABLE IF EXISTS"/"CREATE TABLE" per table, so piping it back
 * in via restoreDump wipes and recreates everything in one shot -- no manual truncation needed.
 */
@Service
public class BackupService {

    private final String host;
    private final String port;
    private final String database;
    private final String username;
    private final String password;

    public BackupService(
            @Value("${DB_HOST:localhost}") String host,
            @Value("${DB_PORT:3306}") String port,
            @Value("${DB_NAME:meal_planner}") String database,
            @Value("${DB_USERNAME:meal_planner}") String username,
            @Value("${DB_PASSWORD:meal_planner}") String password
    ) {
        this.host = host;
        this.port = port;
        this.database = database;
        this.username = username;
        this.password = password;
    }

    public void exportDump(OutputStream out) {
        Process process = start(
                "mysqldump",
                "--host=" + host,
                "--port=" + port,
                "--user=" + username,
                "--single-transaction",
                "--routines",
                "--triggers",
                database
        );
        // Stderr is drained concurrently on its own thread -- if mysqldump writes enough to
        // stderr while we're still reading stdout, its pipe buffer filling up would otherwise
        // stall the child process (and our stdout read along with it).
        CompletableFuture<String> stderr = readStderrAsync(process);
        try (InputStream stdout = process.getInputStream()) {
            stdout.transferTo(out);
        } catch (IOException e) {
            throw new BackupException("Failed to read mysqldump output", e);
        }
        awaitSuccess(process, "mysqldump", stderr);
    }

    public void restoreDump(InputStream in) {
        Process process = start(
                "mysql",
                "--host=" + host,
                "--port=" + port,
                "--user=" + username,
                database
        );
        CompletableFuture<String> stderr = readStderrAsync(process);
        try (OutputStream stdin = process.getOutputStream()) {
            in.transferTo(stdin);
        } catch (IOException e) {
            throw new BackupException("Failed to write backup file to mysql", e);
        }
        awaitSuccess(process, "mysql", stderr);
    }

    private Process start(String... command) {
        ProcessBuilder builder = new ProcessBuilder(command);
        builder.environment().put("MYSQL_PWD", password);
        try {
            return builder.start();
        } catch (IOException e) {
            throw new BackupException(
                    "Failed to start " + command[0] + " -- is it installed and on PATH? "
                            + "(the packaged Docker image installs it; running the backend directly on a "
                            + "host via mvnw/java -jar needs the MySQL/MariaDB client tools installed separately)",
                    e);
        }
    }

    private CompletableFuture<String> readStderrAsync(Process process) {
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        return CompletableFuture.supplyAsync(() -> {
            try (InputStream errStream = process.getErrorStream()) {
                return new String(errStream.readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                return "";
            }
        }, executor).whenComplete((result, error) -> executor.shutdown());
    }

    private void awaitSuccess(Process process, String commandName, CompletableFuture<String> stderr) {
        int exitCode;
        try {
            exitCode = process.waitFor();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BackupException(commandName + " was interrupted", e);
        }
        if (exitCode != 0) {
            String message;
            try {
                message = stderr.get().trim();
            } catch (InterruptedException | ExecutionException e) {
                message = "";
            }
            throw new BackupException(commandName + " failed (exit " + exitCode + "): " + message);
        }
    }
}
