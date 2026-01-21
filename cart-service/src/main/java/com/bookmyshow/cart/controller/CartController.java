package com.bookmyshow.cart.controller;

import com.bookmyshow.cart.model.CartItem;
import com.bookmyshow.cart.service.CartService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping
    public ResponseEntity<CartItem> addItemToCart(@Valid @RequestBody CartItem cartItem) {
        CartItem added = cartService.addItemToCart(cartItem);
        return ResponseEntity.ok(added);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CartItem>> getCartByUserId(@PathVariable Long userId) {
        List<CartItem> items = cartService.getCartByUserId(userId);
        return ResponseEntity.ok(items);
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/item/{itemId}")
    public ResponseEntity<Void> removeItemFromCart(@PathVariable Long userId, @PathVariable Long itemId) {
        cartService.removeItemFromCart(userId, itemId);
        return ResponseEntity.noContent().build();
    }
}
