package com.bookmyshow.cart.service;

import com.bookmyshow.cart.model.CartItem;
import com.bookmyshow.cart.repository.CartRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartRepository cartRepository;

    public CartService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @Transactional
    @CacheEvict(value = "userCart", key = "#cartItem.userId")
    public CartItem addItemToCart(CartItem cartItem) {
        cartItem.setAddedAt(LocalDateTime.now());
        return cartRepository.save(cartItem);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "userCart", key = "#userId")
    public List<CartItem> getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    @Transactional
    @CacheEvict(value = "userCart", key = "#userId")
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }

    @Transactional
    @CacheEvict(value = "userCart", key = "#userId")
    public void removeItemFromCart(Long userId, Long itemId) {
        cartRepository.deleteById(itemId);
    }
}
