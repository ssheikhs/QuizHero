// Rules shared by the browser and the server (keep this file free of server-only imports).

export const ROLES = { INSTRUCTOR: "Instructor", STUDENT: "Student" };

// Same rule as the original signup.php: 8+ chars, 1 uppercase, 1 number, 1 special character.
export const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;
export const PASSWORD_HINT =
  "Password must be at least 8 characters and include 1 uppercase letter, 1 number and 1 special character.";

export const NAME_MAX = 60;

/** Where each role lands after logging in. */
export function homeFor(role) {
  return role === ROLES.INSTRUCTOR ? "/instructor" : "/student";
}
