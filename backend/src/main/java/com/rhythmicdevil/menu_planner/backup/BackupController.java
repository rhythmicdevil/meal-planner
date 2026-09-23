package com.rhythmicdevil.menu_planner.backup;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private static final DateTimeFormatter FILENAME_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> export() {
        String filename = "meal-planner-backup-" + LocalDateTime.now().format(FILENAME_TIMESTAMP) + ".sql";
        StreamingResponseBody body = out -> backupService.exportDump(out);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/sql"))
                .body(body);
    }

    @PostMapping("/import")
    public ResponseEntity<Void> restore(@RequestParam("file") MultipartFile file) {
        try {
            backupService.restoreDump(file.getInputStream());
        } catch (IOException e) {
            throw new BackupException("Failed to read uploaded backup file", e);
        }
        return ResponseEntity.noContent().build();
    }
}
