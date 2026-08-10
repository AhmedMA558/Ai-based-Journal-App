package com.aijournal.auth.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "mfa_recovery_codes")
public class MfaRecoveryCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // BCrypt hash - same treatment as User.password, never stored/compared as plaintext.
    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private Boolean used = false;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public MfaRecoveryCode() {
    }

    public MfaRecoveryCode(Long id, User user, String codeHash) {
        this.id = id;
        this.user = user;
        this.codeHash = codeHash;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.used == null) this.used = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }
    public Boolean getUsed() { return used; }
    public void setUsed(Boolean used) { this.used = used; }
    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant usedAt) { this.usedAt = usedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
