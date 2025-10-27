/**
 * Custom Error Classes for Better Error Handling
 */

/**
 * User-facing error (safe to send to client)
 */
class UserFacingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'UserFacingError';
    this.statusCode = statusCode;
    this.isOperational = true; // Safe to send to client
  }
}

/**
 * Validation error
 */
class ValidationError extends UserFacingError {
  constructor(message, errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends UserFacingError {
  constructor(message = 'กรุณาเข้าสู่ระบบก่อนใช้งาน') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends UserFacingError {
  constructor(message = 'ไม่มีสิทธิ์เข้าถึง') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
class NotFoundError extends UserFacingError {
  constructor(message = 'ไม่พบข้อมูล') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (duplicate, etc.)
 */
class ConflictError extends UserFacingError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends UserFacingError {
  constructor(message = 'คุณทำรายการบ่อยเกินไป กรุณารอสักครู่') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Internal server error (not operational)
 */
class InternalServerError extends Error {
  constructor(message = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์') {
    super(message);
    this.name = 'InternalServerError';
    this.statusCode = 500;
    this.isOperational = false; // Not safe to send details to client
  }
}

module.exports = {
  UserFacingError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError
};

