package com.duyhung.identify_service.repository;

import com.duyhung.identify_service.entity.OAuth2LoginTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface OAuth2LoginTicketRepository extends JpaRepository<OAuth2LoginTicket, String> {
    @Modifying
    @Query("delete from OAuth2LoginTicket ticket where ticket.id = :id and ticket.expiresAt > :now")
    int consumeIfValid(@Param("id") String id, @Param("now") Instant now);
}
