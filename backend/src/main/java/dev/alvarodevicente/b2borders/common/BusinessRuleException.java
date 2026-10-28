package dev.alvarodevicente.b2borders.common;

/**
 * The request is well formed but breaks a business rule (for example, ordering a brand without a license).
 * Mapped to HTTP 422.
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
