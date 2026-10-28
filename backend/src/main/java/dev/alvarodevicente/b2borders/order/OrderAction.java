package dev.alvarodevicente.b2borders.order;

/**
 * Actions a user may take on an order right now. The API sends the list with each order, so the
 * frontend only shows the buttons that will work: the rules live in one place, the backend.
 */
public enum OrderAction {
    EDIT_LINES,
    CONFIRM,
    CANCEL,
    SHIP,
    DELIVER
}
