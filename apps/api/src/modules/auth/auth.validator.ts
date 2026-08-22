// Importing modules
import { body } from "express-validator";
import validateErrors from "../../shared/utils/validateErrors.util.js";

const signupValidators = [
    // validating the name field
    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3 })
        .withMessage("Name must be at least 3 characters long"),

    // validating the email field
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),

    // validating the password field
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    // validating errors
    validateErrors,
];

const loginValidators = [
    // validating the email field
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),

    // validating the password field
    body("password").notEmpty().withMessage("Password is required"),

    // validating errors
    validateErrors,
];

const forgotPasswordValidators = [
    // validating the email field
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),

    // validating errors
    validateErrors,
];

const resetPasswordValidators = [
    // validating the reset token field
    body("token").notEmpty().withMessage("Reset Token is required"),

    // validating the new password field
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    // validating errors
    validateErrors,
];

const googleLoginValidators = [
    // validating the credential field
    body("credential").notEmpty().withMessage("Google credential is required"),

    // validating errors
    validateErrors,
];

const verifyOtpValidators = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),
    body("otp")
        .notEmpty()
        .withMessage("OTP code is required")
        .isLength({ min: 4, max: 10 })
        .withMessage("OTP must be between 4 and 10 characters"),
    validateErrors,
];

const resendOtpValidators = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),
    validateErrors,
];

export {
    signupValidators,
    loginValidators,
    forgotPasswordValidators,
    resetPasswordValidators,
    googleLoginValidators,
    verifyOtpValidators,
    resendOtpValidators,
};
