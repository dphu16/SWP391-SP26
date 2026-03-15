package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.service.impl.FileServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/**
 * FileServiceImpl thao tác trực tiếp với filesystem (hardcode "uploads/cv/").
 *
 * Chiến lược:
 * - Tạo TestableFileService (subclass) override getUploadDir() trả về @TempDir
 *   → không ghi vào filesystem thật, JUnit tự dọn sau mỗi test.
 * - Yêu cầu thêm 1 protected method vào FileServiceImpl:
 *     protected Path getUploadDir() { return Paths.get("uploads/cv/"); }
 *   và dùng nó trong processAndSaveFile() + deletePDF().
 */
@DisplayName("FileServiceImpl — Unit Tests")
class FileServiceTest {

    @TempDir
    Path tempDir;

    private FileServiceImpl fileService;
    private Path uploadDir;

    @BeforeEach
    void setUp() throws IOException {
        uploadDir = tempDir.resolve("uploads/cv");
        Files.createDirectories(uploadDir);

        // Subclass override đường dẫn hardcode → trỏ vào tempDir
        fileService = new FileServiceImpl() {
            public Path getUploadDir() {
                return uploadDir;
            }
        };
    }

    // ─────────── helper ───────────────────────────────────────────────────

    private MockMultipartFile validPdf(String filename) {
        return new MockMultipartFile(
                "file",
                filename,
                "application/pdf",
                ("%PDF-1.4 content of " + filename).getBytes()
        );
    }

    // ====================================================================
    // inputPDF()
    // ====================================================================
    @Nested
    @DisplayName("inputPDF()")
    class InputPDF {

        // ── Guard: null / empty ──────────────────────────────────────────

        @Test
        @DisplayName("file null — ném RuntimeException 'CV file is required'")
        void inputPDF_nullFile_throwsRuntimeException() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(null));
            assertEquals("CV file is required", ex.getMessage());
        }

        @Test
        @DisplayName("file rỗng (isEmpty = true) — ném RuntimeException 'CV file is required'")
        void inputPDF_emptyFile_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "cv.pdf", "application/pdf", new byte[0]);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("CV file is required", ex.getMessage());
        }

        // ── Guard: originalFilename ──────────────────────────────────────

        @Test
        @DisplayName("originalFilename null — ném RuntimeException 'CV file is required'")
        void inputPDF_nullOriginalFilename_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", null, "application/pdf", "content".getBytes());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("CV file is required", ex.getMessage());
        }

        @Test
        @DisplayName("originalFilename rỗng — ném RuntimeException 'CV file is required'")
        void inputPDF_emptyOriginalFilename_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "", "application/pdf", "content".getBytes());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("CV file is required", ex.getMessage());
        }

        // ── Guard: extension ─────────────────────────────────────────────

        @Test
        @DisplayName("extension .docx — ném RuntimeException 'Only PDF files are allowed'")
        void inputPDF_docxExtension_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "resume.docx", "application/pdf", "content".getBytes());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("Only PDF files are allowed", ex.getMessage());
        }

        @Test
        @DisplayName("extension .txt — ném RuntimeException 'Only PDF files are allowed'")
        void inputPDF_txtExtension_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "cv.txt", "application/pdf", "content".getBytes());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("Only PDF files are allowed", ex.getMessage());
        }

        @Test
        @DisplayName("extension .PDF hoa — hợp lệ (toLowerCase), không throw")
        void inputPDF_uppercasePdfExtension_valid() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "CV.PDF", "application/pdf", "content".getBytes());

            assertDoesNotThrow(() -> fileService.inputPDF(file));
        }

        // ── Guard: content-type ──────────────────────────────────────────

        @Test
        @DisplayName("content-type image/png — ném RuntimeException 'Invalid file type'")
        void inputPDF_wrongContentType_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "cv.pdf", "image/png", "content".getBytes());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("Invalid file type. Only PDF allowed", ex.getMessage());
        }

        @Test
        @DisplayName("extension .pdf nhưng content-type text/plain — ném RuntimeException")
        void inputPDF_pdfExtensionButWrongContentType_throwsRuntimeException() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "cv.pdf", "text/plain", "content".getBytes());

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> fileService.inputPDF(file));
            assertEquals("Invalid file type. Only PDF allowed", ex.getMessage());
        }

        // ── Happy path ───────────────────────────────────────────────────

        @Test
        @DisplayName("File hợp lệ — trả về tên file có đuôi .pdf")
        void inputPDF_valid_returnsFileNameWithPdfExtension() {
            String result = fileService.inputPDF(validPdf("cv.pdf"));

            assertNotNull(result);
            assertTrue(result.endsWith(".pdf"),
                    "Tên trả về phải có đuôi .pdf, nhận được: " + result);
        }

        @Test
        @DisplayName("File hợp lệ — file thực sự tồn tại trên disk sau khi lưu")
        void inputPDF_valid_fileExistsOnDisk() {
            String savedName = fileService.inputPDF(validPdf("cv.pdf"));

            assertTrue(Files.exists(uploadDir.resolve(savedName)),
                    "File phải tồn tại trên disk: " + savedName);
        }

        @Test
        @DisplayName("File hợp lệ — nội dung file lưu khớp nội dung gốc")
        void inputPDF_valid_savedContentMatchesOriginal() throws IOException {
            byte[] original = "%PDF-1.4 exact content".getBytes();
            MockMultipartFile file = new MockMultipartFile(
                    "file", "cv.pdf", "application/pdf", original);

            String savedName = fileService.inputPDF(file);
            byte[] saved = Files.readAllBytes(uploadDir.resolve(savedName));

            assertArrayEquals(original, saved);
        }

        @Test
        @DisplayName("Mỗi lần upload tạo UUID khác nhau — tên file duy nhất")
        void inputPDF_calledTwice_generatesDifferentFileNames() {
            String name1 = fileService.inputPDF(validPdf("cv.pdf"));
            String name2 = fileService.inputPDF(validPdf("cv.pdf"));

            assertNotEquals(name1, name2,
                    "Hai lần upload phải tạo tên file UUID khác nhau");
        }

        @Test
        @DisplayName("Tên file trả về là UUID (36 ký tự) + '.pdf'")
        void inputPDF_valid_fileNameIsUuidPlusPdfExtension() {
            String result = fileService.inputPDF(validPdf("any-name.pdf"));

            // format: <UUID>.pdf → tổng 40 ký tự (36 + 1 dấu chấm + 3)
            assertTrue(result.matches("[0-9a-f\\-]{36}\\.pdf"),
                    "Tên file phải có dạng UUID.pdf, nhận được: " + result);
        }
    }

    // ====================================================================
    // deletePDF()
    // ====================================================================
    @Nested
    @DisplayName("deletePDF()")
    class DeletePDF {

        @Test
        @DisplayName("File tồn tại — bị xóa sau khi gọi deletePDF")
        void deletePDF_existingFile_fileIsDeleted() throws IOException {
            String fileName = "to-delete.pdf";
            Files.write(uploadDir.resolve(fileName), "content".getBytes());
            assertTrue(Files.exists(uploadDir.resolve(fileName)));

            fileService.deletePDF(fileName);

            assertFalse(Files.exists(uploadDir.resolve(fileName)),
                    "File phải bị xóa");
        }

        @Test
        @DisplayName("File không tồn tại — không ném exception (deleteIfExists)")
        void deletePDF_nonExistingFile_noException() {
            assertDoesNotThrow(() -> fileService.deletePDF("ghost.pdf"));
        }

        @Test
        @DisplayName("fileName null — không ném exception (swallow trong catch)")
        void deletePDF_nullFileName_noException() {
            assertDoesNotThrow(() -> fileService.deletePDF(null));
        }

        @Test
        @DisplayName("Chỉ xóa đúng file target, không ảnh hưởng file khác")
        void deletePDF_onlyDeletesTargetFile() throws IOException {
            Files.write(uploadDir.resolve("target.pdf"),  "a".getBytes());
            Files.write(uploadDir.resolve("sibling.pdf"), "b".getBytes());

            fileService.deletePDF("target.pdf");

            assertFalse(Files.exists(uploadDir.resolve("target.pdf")),
                    "target.pdf phải bị xóa");
            assertTrue(Files.exists(uploadDir.resolve("sibling.pdf")),
                    "sibling.pdf phải còn nguyên");
        }

        @Test
        @DisplayName("Xóa file vừa upload — file không còn tồn tại")
        void deletePDF_fileJustUploaded_isDeleted() {
            String savedName = fileService.inputPDF(validPdf("cv.pdf"));
            assertTrue(Files.exists(uploadDir.resolve(savedName)));

            fileService.deletePDF(savedName);

            assertFalse(Files.exists(uploadDir.resolve(savedName)),
                    "File vừa upload phải bị xóa");
        }
    }
}