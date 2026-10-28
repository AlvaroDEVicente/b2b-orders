package dev.alvarodevicente.b2borders.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class CustomerDtos {

    private CustomerDtos() {
    }

    public record CustomerRequest(
            @NotBlank(message = "El nombre es obligatorio") @Size(max = 160) String name,
            @NotBlank(message = "El CIF/NIF es obligatorio")
            @Pattern(regexp = "^[A-Za-z0-9]{9}$", message = "El CIF/NIF debe tener 9 caracteres alfanuméricos")
            String taxId,
            @NotBlank(message = "El email es obligatorio") @Email(message = "El email no es válido") String email,
            @Size(max = 30) String phone,
            @NotBlank(message = "La ciudad es obligatoria") @Size(max = 80) String city,
            Long salesRepId,
            Boolean active) {
    }

    public record CustomerResponse(Long id, String name, String taxId, String email, String phone, String city,
                                   Long salesRepId, String salesRepName, boolean active) {

        public static CustomerResponse from(Customer customer) {
            var rep = customer.getSalesRep();
            return new CustomerResponse(customer.getId(), customer.getName(), customer.getTaxId(),
                    customer.getEmail(), customer.getPhone(), customer.getCity(),
                    rep == null ? null : rep.getId(), rep == null ? null : rep.getFullName(), customer.isActive());
        }
    }
}
