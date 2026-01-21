package com.bookmyshow.event;

import com.bookmyshow.event.model.Event;
import com.bookmyshow.event.repository.EventRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class EventServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(EventServiceApplication.class, args);
    }

    @Bean
    CommandLineRunner seedEvents(EventRepository eventRepository) {
        return args -> {
            if (eventRepository.count() > 0) {
                return;
            }

            Event movie = new Event();
            movie.setTitle("Neon Nights");
            movie.setDescription("Cyber-noir thriller set in a rain-soaked megacity.");
            movie.setType("MOVIE");
            movie.setVenue("Downtown IMAX");
            movie.setEventDateTime(LocalDateTime.now().plusDays(1).withHour(19).withMinute(30));
            movie.setTotalSeats(180);
            movie.setAvailableSeats(180);
            movie.setPrice(14.99);

            Event concert = new Event();
            concert.setTitle("Skyline Sessions");
            concert.setDescription("Indie bands live on the rooftop stage.");
            concert.setType("CONCERT");
            concert.setVenue("Harbor Arena");
            concert.setEventDateTime(LocalDateTime.now().plusDays(3).withHour(20).withMinute(0));
            concert.setTotalSeats(250);
            concert.setAvailableSeats(250);
            concert.setPrice(39.50);

            Event theater = new Event();
            theater.setTitle("Clockwork Sonata");
            theater.setDescription("Steampunk-inspired stage drama with live orchestra.");
            theater.setType("THEATER");
            theater.setVenue("Grand Royale");
            theater.setEventDateTime(LocalDateTime.now().plusDays(5).withHour(18).withMinute(45));
            theater.setTotalSeats(200);
            theater.setAvailableSeats(200);
            theater.setPrice(49.00);

            Event sports = new Event();
            sports.setTitle("City Derby Finals");
            sports.setDescription("Championship match under the lights.");
            sports.setType("SPORTS");
            sports.setVenue("Riverfront Stadium");
            sports.setEventDateTime(LocalDateTime.now().plusDays(2).withHour(17).withMinute(15));
            sports.setTotalSeats(400);
            sports.setAvailableSeats(400);
            sports.setPrice(59.00);

            Event comedy = new Event();
            comedy.setTitle("Laugh Lab Live");
            comedy.setDescription("Stand-up night featuring emerging comics.");
            comedy.setType("COMEDY");
            comedy.setVenue("Brickhouse Club");
            comedy.setEventDateTime(LocalDateTime.now().plusDays(4).withHour(21).withMinute(0));
            comedy.setTotalSeats(120);
            comedy.setAvailableSeats(120);
            comedy.setPrice(24.00);

            Event expo = new Event();
            expo.setTitle("FutureTech Expo");
            expo.setDescription("Hands-on demos of upcoming consumer tech.");
            expo.setType("EXPO");
            expo.setVenue("Innovation Center");
            expo.setEventDateTime(LocalDateTime.now().plusDays(7).withHour(10).withMinute(0));
            expo.setTotalSeats(500);
            expo.setAvailableSeats(500);
            expo.setPrice(19.00);

            List<Event> seed = List.of(movie, concert, theater, sports, comedy, expo);
            eventRepository.saveAll(seed);
        };
    }
}
