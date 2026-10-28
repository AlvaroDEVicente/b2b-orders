package dev.alvarodevicente.b2borders.common;

/** Wrong email or password. Mapped to HTTP 401 with the same message in both cases. */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Email o contraseña incorrectos");
    }
}
