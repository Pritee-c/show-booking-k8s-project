package com.bookmyshow.event.repository;

import com.bookmyshow.event.model.Event;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByType(String type);
    List<Event> findByVenue(String venue);
    List<Event> findByTitleContaining(String title);
}
