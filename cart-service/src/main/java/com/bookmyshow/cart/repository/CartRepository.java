package com.bookmyshow.cart.repository;

import com.bookmyshow.cart.model.CartItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
