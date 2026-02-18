"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const AuthHandler_1 = require("./AuthHandler");
const Citizenhandler_1 = require("./Citizenhandler");
const mla_1 = require("./mla");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/api/v1/auth", AuthHandler_1.authHandler);
app.use("/api/v1/citizen", Citizenhandler_1.citizenHandler);
app.use("/api/v1/mla", mla_1.mlaHandler);
app.listen(4000, () => {
    console.log("Server running on the port 4000");
});
