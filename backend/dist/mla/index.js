"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mlaHandler = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.mlaHandler = (0, express_1.Router)();
function generateUniqueMlaEmail(fullName, existingEmails) {
    let firstName = fullName.split(" ")[0].toLowerCase();
    let email = `${firstName}@mla.com`;
    let counter = 1;
    while (existingEmails.has(email)) {
        email = `${firstName}${counter}@mla.com`;
        counter++;
    }
    existingEmails.add(email);
    return email;
}
exports.mlaHandler.post("/addMla", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const mla = req.body;
    if (!mla || !mla.name || !mla.constituency || !mla.party) {
        return res.status(400).json({ message: "Request body must be a valid MLA object" });
    }
    try {
        // Generate deterministic email
        const generateEmail = (mla) => {
            const normalizedName = mla.name.toLowerCase().replace(/\s+/g, '');
            const normalizedConstituency = mla.constituency.toLowerCase().replace(/\s+/g, '');
            return `${normalizedName}.${normalizedConstituency}@civicos.in`;
        };
        const email = mla.email || generateEmail(mla);
        // Convert mock_history object to string
        const mockHistoryStr = mla.mock_history ? JSON.stringify(mla.mock_history) : null;
        const created = yield prisma.mLA.upsert({
            where: { email },
            update: {},
            create: {
                name: mla.name,
                constituency: mla.constituency,
                party: mla.party,
                email,
                phone: mla.phone,
                image: mla.image,
                criminalCasesCount: mla.criminal_cases_count,
                education: mla.education,
                totalAssetsInRupees: mla.total_assets_in_rupees,
                liabilitiesInRupees: mla.liabilities_in_rupees,
                electionYear: mla.election_year,
                dataSource: mla.data_source,
                mockHistory: mockHistoryStr, // save as string
                totalComplaints: 0,
                resolvedComplaints: 0,
            },
        });
        return res.status(201).json({
            message: "MLA added successfully",
            mla: created,
        });
    }
    catch (error) {
        console.error("Error adding MLA:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
exports.mlaHandler.get("/fetchMlas", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mlas = yield prisma.mLA.findMany({
            orderBy: { name: "asc" },
        });
        return res.status(200).json({ count: mlas.length, mlas });
    }
    catch (error) {
        console.error("Error fetching MLAs:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}));
