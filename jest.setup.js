require("dotenv").config();
process.env.JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "jest-jwt-secret";
process.env.JWT_SECRET_USER = process.env.JWT_SECRET_USER || "jest-user-jwt-secret";
