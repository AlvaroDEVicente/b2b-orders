package dev.alvarodevicente.b2borders.common;

/**
 * The resource does not exist, or the current user is not allowed to know it exists.
 * Mapped to HTTP 404.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String resource, Object id) {
        super(resource + " " + id + " no encontrado");
    }
}
