package com.aijournal.journal.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "journals")
@SQLDelete(sql = "UPDATE journals SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("is_deleted = false")
public class Journal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "content_encrypted", nullable = false)
    private Boolean contentEncrypted = false;

    @Column(name = "is_draft", nullable = false)
    private Boolean isDraft = false;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @Column(name = "is_favorite", nullable = false)
    private Boolean isFavorite = false;

    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @Column(length = 50)
    private String mood = "NEUTRAL";

    @Column(length = 100)
    private String location;

    @Column(length = 50)
    private String weather;

    @Column(name = "word_count", nullable = false)
    private Integer wordCount = 0;

    @Column(name = "character_count", nullable = false)
    private Integer characterCount = 0;

    @Column(name = "reading_time_minutes", nullable = false)
    private Integer readingTimeMinutes = 1;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "journal_tags", joinColumns = @JoinColumn(name = "journal_id"))
    @Column(name = "tag_name")
    private Set<String> tags = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Version
    private Long version;

    public Journal() {
    }

    public Journal(Long id, Long userId, Long folderId, Long categoryId, String title, String content, Boolean contentEncrypted, Boolean isDraft, Boolean isPinned, Boolean isFavorite, Boolean isArchived, String mood, String location, String weather, Set<String> tags) {
        this.id = id;
        this.userId = userId;
        this.folderId = folderId;
        this.categoryId = categoryId;
        this.title = title;
        this.content = content;
        this.contentEncrypted = contentEncrypted != null ? contentEncrypted : false;
        this.isDraft = isDraft != null ? isDraft : false;
        this.isPinned = isPinned != null ? isPinned : false;
        this.isFavorite = isFavorite != null ? isFavorite : false;
        this.isArchived = isArchived != null ? isArchived : false;
        this.mood = mood != null ? mood : "NEUTRAL";
        this.location = location;
        this.weather = weather;
        this.tags = tags != null ? tags : new HashSet<>();
        calculateMetrics();
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.contentEncrypted == null) this.contentEncrypted = false;
        if (this.isDraft == null) this.isDraft = false;
        if (this.isPinned == null) this.isPinned = false;
        if (this.isFavorite == null) this.isFavorite = false;
        if (this.isArchived == null) this.isArchived = false;
        if (this.isDeleted == null) this.isDeleted = false;
        if (this.mood == null) this.mood = "NEUTRAL";
        if (this.tags == null) this.tags = new HashSet<>();
        calculateMetrics();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateMetrics();
    }

    public void calculateMetrics() {
        // When contentEncrypted is true, `content` holds ciphertext at every
        // point Hibernate's @PrePersist/@PreUpdate lifecycle invokes this
        // method - recomputing from it would silently overwrite the real
        // word/char/reading-time metrics with meaningless ciphertext-derived
        // numbers. JournalServiceImpl computes real metrics from the plaintext
        // before encrypting and relies on this guard to preserve them.
        if (Boolean.TRUE.equals(this.contentEncrypted)) {
            return;
        }
        if (this.content != null) {
            this.characterCount = this.content.length();
            String[] words = this.content.trim().split("\\s+");
            this.wordCount = (this.content.isBlank()) ? 0 : words.length;
            this.readingTimeMinutes = Math.max(1, (int) Math.ceil(this.wordCount / 200.0));
        } else {
            this.characterCount = 0;
            this.wordCount = 0;
            this.readingTimeMinutes = 1;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Boolean getContentEncrypted() { return contentEncrypted; }
    public void setContentEncrypted(Boolean contentEncrypted) { this.contentEncrypted = contentEncrypted; }
    public Boolean getIsDraft() { return isDraft; }
    public void setIsDraft(Boolean isDraft) { this.isDraft = isDraft; }
    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }
    public Boolean getIsFavorite() { return isFavorite; }
    public void setIsFavorite(Boolean isFavorite) { this.isFavorite = isFavorite; }
    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getWeather() { return weather; }
    public void setWeather(String weather) { this.weather = weather; }
    public Integer getWordCount() { return wordCount; }
    public void setWordCount(Integer wordCount) { this.wordCount = wordCount; }
    public Integer getCharacterCount() { return characterCount; }
    public void setCharacterCount(Integer characterCount) { this.characterCount = characterCount; }
    public Integer getReadingTimeMinutes() { return readingTimeMinutes; }
    public void setReadingTimeMinutes(Integer readingTimeMinutes) { this.readingTimeMinutes = readingTimeMinutes; }
    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
