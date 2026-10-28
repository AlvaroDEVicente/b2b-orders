package dev.alvarodevicente.b2borders.common;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String resource, Object id) {
        super(resource + " " + id + " no encontrado");
    }
}
