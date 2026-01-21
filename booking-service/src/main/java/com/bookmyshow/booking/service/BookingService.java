package com.bookmyshow.booking.service;

import com.bookmyshow.booking.model.Booking;
import com.bookmyshow.booking.repository.BookingRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;

    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public Booking createBooking(Booking booking) {
        booking.setBookingDateTime(LocalDateTime.now());
        if (booking.getStatus() == null) {
            booking.setStatus("PENDING");
        }
        return bookingRepository.save(booking);
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
    }

    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByEventId(Long eventId) {
        return bookingRepository.findByEventId(eventId);
    }

    @Transactional
    public Booking updateBookingStatus(Long id, String status) {
        Booking booking = getBookingById(id);
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    @Transactional
    public void cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
    }
}
