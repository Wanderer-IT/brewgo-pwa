// Client-side checks give instant feedback. The server validates again (never trust the client).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(input) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.startsWith("63") && d.length === 12) d = "0" + d.slice(2);
  else if (d.length === 10 && d.startsWith("9")) d = "0" + d;
  return /^09\d{9}$/.test(d) ? d : null;
}

export function validateLogin({ identifier, password }) {
  const errors = {};
  if (!identifier.trim()) errors.identifier = "Enter your email or phone number";
  if (!password) errors.password = "Enter your password";
  return errors;
}

export function validateRegister({ fullName, email, phone, address, password, acceptTerms }) {
  const errors = {};
  if (fullName.trim().length < 2) errors.fullName = "Enter your full name";
  if (!EMAIL.test(email.trim())) errors.email = "Enter a valid email address";
  if (!normalizePhone(phone)) errors.phone = "Enter a Philippine mobile number, e.g. 917 123 4567";
  if (address.trim().length < 5) errors.address = "Enter your address (at least 5 characters)";
  if (password.length < 8) errors.password = "Use at least 8 characters";
  if (!acceptTerms) errors.acceptTerms = "Please agree to the Terms of Service and Privacy Policy";
  return errors;
}

export function validateContact({ name, email, message }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = "Enter your name";
  if (!EMAIL.test(email.trim())) errors.email = "Enter a valid email address";
  if (message.trim().length < 10) errors.message = "Tell us a bit more (at least 10 characters)";
  return errors;
}

export function validateAddress(value) {
  return value.trim().length < 5 ? "Enter a delivery address (at least 5 characters)" : "";
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
