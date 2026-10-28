-- Initial schema for B2B Orders.
-- Money is stored as NUMERIC (never floating point) and dates with time zone.

CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'SALES', 'CUSTOMER')),
    customer_id   BIGINT,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE customer (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(160) NOT NULL,
    tax_id       VARCHAR(20)  NOT NULL UNIQUE,
    email        VARCHAR(160) NOT NULL,
    phone        VARCHAR(30),
    city         VARCHAR(80)  NOT NULL,
    sales_rep_id BIGINT REFERENCES app_user (id),
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- app_user and customer reference each other, so this FK is added afterwards.
ALTER TABLE app_user
    ADD CONSTRAINT fk_app_user_customer FOREIGN KEY (customer_id) REFERENCES customer (id);

-- A CUSTOMER user always belongs to a customer; staff users never do.
ALTER TABLE app_user
    ADD CONSTRAINT chk_app_user_customer_role CHECK ((role = 'CUSTOMER') = (customer_id IS NOT NULL));

CREATE INDEX idx_customer_sales_rep ON customer (sales_rep_id);

CREATE TABLE brand (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(80)  NOT NULL UNIQUE,
    royalty_rate NUMERIC(5, 2) NOT NULL CHECK (royalty_rate >= 0 AND royalty_rate <= 100),
    active       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE product (
    id         BIGSERIAL PRIMARY KEY,
    sku        VARCHAR(40)   NOT NULL UNIQUE,
    name       VARCHAR(160)  NOT NULL,
    brand_id   BIGINT        NOT NULL REFERENCES brand (id),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    stock      INTEGER       NOT NULL CHECK (stock >= 0),
    active     BOOLEAN       NOT NULL DEFAULT TRUE,
    version    BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_brand ON product (brand_id);

CREATE TABLE license (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT      NOT NULL REFERENCES customer (id),
    brand_id    BIGINT      NOT NULL REFERENCES brand (id),
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_license_customer_brand ON license (customer_id, brand_id);

CREATE TABLE orders (
    id           BIGSERIAL PRIMARY KEY,
    customer_id  BIGINT         NOT NULL REFERENCES customer (id),
    created_by   BIGINT         NOT NULL REFERENCES app_user (id),
    status       VARCHAR(20)    NOT NULL
        CHECK (status IN ('DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    total        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    version      BIGINT         NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_confirmed_at ON orders (confirmed_at);

CREATE TABLE order_line (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT         NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id BIGINT         NOT NULL REFERENCES product (id),
    quantity   INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    UNIQUE (order_id, product_id)
);
