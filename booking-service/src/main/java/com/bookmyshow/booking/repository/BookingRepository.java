package com.bookmyshow.booking.repository;

import com.bookmyshow.booking.model.Booking;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByEventId(Long eventId);
    List<Booking> findByStatus(String status);
}
