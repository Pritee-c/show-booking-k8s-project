package com.bookmyshow.event.service;

import com.bookmyshow.event.model.Event;
import com.bookmyshow.event.repository.EventRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Transactional
    public Event createEvent(Event event) {
        if (event.getAvailableSeats() == null) {
            event.setAvailableSeats(event.getTotalSeats());
        }
        return eventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    }

    @Transactional(readOnly = true)
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Event> getEventsByType(String type) {
        return eventRepository.findByType(type);
    }

    @Transactional(readOnly = true)
    public List<Event> getEventsByVenue(String venue) {
        return eventRepository.findByVenue(venue);
    }

    @Transactional(readOnly = true)
    public List<Event> searchEventsByTitle(String title) {
        return eventRepository.findByTitleContaining(title);
    }

    @Transactional
    public Event updateEvent(Long id, Event eventDetails) {
        Event event = getEventById(id);
        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setType(eventDetails.getType());
        event.setVenue(eventDetails.getVenue());
        event.setEventDateTime(eventDetails.getEventDateTime());
        event.setTotalSeats(eventDetails.getTotalSeats());
        event.setAvailableSeats(eventDetails.getAvailableSeats());
        event.setPrice(eventDetails.getPrice());
        return eventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}
