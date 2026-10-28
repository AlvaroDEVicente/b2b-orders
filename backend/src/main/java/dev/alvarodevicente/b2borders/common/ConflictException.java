package dev.alvarodevicente.b2borders.common;

/**
 * The request clashes with the current state of the data (invalid status change, not enough stock,
 * duplicated unique value). Mapped to HTTP 409.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
