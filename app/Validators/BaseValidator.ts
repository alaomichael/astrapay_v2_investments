export default class BaseValidator {
    /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
    public messages = {
        minLength: "{{ field }} must be at least {{ options.minLength }} characters long",
        maxLength: "{{ field }} must be less then {{ options.maxLength }} characters long",
        required: "{{ field }} is required",
        unique: "{{ field }} must be unique, and this value is already taken",
        exists: "{{ field }} does not exist. Enter a valid value"
    }

}