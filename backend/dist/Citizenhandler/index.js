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
exports.citizenHandler = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const emailService_1 = require("./emailService");
const prisma = new client_1.PrismaClient();
exports.citizenHandler = (0, express_1.Router)();
exports.citizenHandler.get("/details", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    try {
        const citizen = yield prisma.citizen.findUnique({
            where: { email: String(email) },
            include: {
                linked_MLAs: {
                    orderBy: {
                        createdAt: 'desc' // ✅ Most recent MLA first
                    },
                    take: 1 // ✅ Only get the most recent one
                },
                linked_Organizations: true,
                issues: {
                    include: {
                        mla: true,
                        organization: true,
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
            },
        });
        if (!citizen) {
            return res.status(404).json({ message: "Citizen not found" });
        }
        const mostRecentMLA = citizen.linked_MLAs[0] || null;
        return res.status(200).json({
            citizen: {
                id: citizen.id,
                name: citizen.name,
                email: citizen.email,
                constituency: citizen.constituency,
                mlaId: (mostRecentMLA === null || mostRecentMLA === void 0 ? void 0 : mostRecentMLA.id) || null,
                currentMLA: mostRecentMLA ? {
                    id: mostRecentMLA.id,
                    name: mostRecentMLA.name,
                    party: mostRecentMLA.party,
                    email: mostRecentMLA.email,
                    phone: mostRecentMLA.phone,
                    constituency: mostRecentMLA.constituency,
                    rating: mostRecentMLA.rating,
                } : null,
                linked_Organizations: citizen.linked_Organizations.map((org) => ({
                    id: org.id,
                    name: org.name,
                    category: org.category,
                    constituency: org.constituency,
                    contact_email: org.contact_email,
                    contact_phone: org.contact_phone,
                    address: org.address,
                })),
                issues: citizen.issues.map((issue) => ({
                    id: issue.id,
                    title: issue.title,
                    description: issue.description,
                    category: issue.category,
                    mediaUrl: issue.mediaUrl,
                    location: issue.location,
                    status: issue.status,
                    severity: issue.severity,
                    createdAt: issue.createdAt,
                    updatedAt: issue.updatedAt,
                    mlaId: issue.mlaId,
                    organizationId: issue.organizationId,
                    mla: issue.mla ? {
                        id: issue.mla.id,
                        name: issue.mla.name,
                        party: issue.mla.party,
                        constituency: issue.mla.constituency,
                    } : null,
                    organization: issue.organization ? {
                        id: issue.organization.id,
                        name: issue.organization.name,
                        category: issue.organization.category,
                        constituency: issue.organization.constituency,
                    } : null,
                })),
            },
        });
    }
    catch (error) {
        console.error("Error fetching citizen details:", error);
        res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? "something went wrong" : undefined
        });
    }
}));
// Add the correct import path
exports.citizenHandler.post("/issue", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { update, issueId, title, description, category, mediaUrl, location, latitude, longitude, citizenId, mlaId, organizationId, status, severity, } = req.body;
    try {
        // --- Update existing issue ---
        if (update) {
            if (!issueId || !status) {
                return res
                    .status(400)
                    .json({ message: "issueId and status are required for update" });
            }
            const existingIssue = yield prisma.issue.findUnique({ where: { id: issueId } });
            if (!existingIssue) {
                return res.status(404).json({ message: "Issue not found" });
            }
            const updatedIssue = yield prisma.issue.update({
                where: { id: issueId },
                data: Object.assign(Object.assign(Object.assign(Object.assign({ status: status }, (severity && { severity: severity })), (latitude && { latitude })), (longitude && { longitude })), { updatedAt: new Date() }),
            });
            return res.status(200).json({
                message: "Issue updated successfully",
                issue: updatedIssue,
            });
        }
        // --- Create new issue ---
        if (!title || !description || !category || !location || !citizenId) {
            return res.status(400).json({
                message: "title, description, category, location, and citizenId are required",
            });
        }
        const citizenExists = yield prisma.citizen.findUnique({ where: { id: citizenId } });
        if (!citizenExists) {
            return res.status(400).json({ message: "Invalid citizenId — Citizen not found" });
        }
        if (mlaId) {
            const mlaExists = yield prisma.mLA.findUnique({ where: { id: mlaId } });
            if (!mlaExists) {
                return res.status(400).json({ message: "Invalid mlaId — MLA not found" });
            }
        }
        if (organizationId) {
            const orgExists = yield prisma.organization.findUnique({ where: { id: organizationId } });
            if (!orgExists) {
                return res.status(400).json({ message: "Invalid organizationId — Organization not found" });
            }
        }
        const newIssue = yield prisma.issue.create({
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ title,
                description,
                category,
                mediaUrl,
                location }, (latitude && { latitude: parseFloat(latitude) })), (longitude && { longitude: parseFloat(longitude) })), { status: "PENDING", severity: (severity || "LOW"), // Cast to enum type
                citizenId }), (mlaId && { mlaId })), (organizationId && { organizationId })),
        });
        // Send confirmation email to citizen
        try {
            yield (0, emailService_1.sendIssueCreatedEmail)(citizenExists.email, citizenExists.name, {
                id: newIssue.id,
                title: newIssue.title,
                description: newIssue.description,
                category: newIssue.category,
                priority: newIssue.severity,
                status: newIssue.status,
                location: newIssue.location,
                createdAt: newIssue.createdAt.toISOString(),
            });
            console.log("✅ Confirmation email sent to:", citizenExists.email);
        }
        catch (emailError) {
            console.error("❌ Failed to send confirmation email:", emailError);
            // Don't fail the request if email fails - issue was still created
        }
        return res.status(201).json({
            message: "Issue created successfully",
            issue: newIssue,
        });
    }
    catch (error) {
        console.error("Error handling issue:", error);
        console.error("Error details:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? "something went wrong" : undefined
        });
    }
}));
exports.citizenHandler.get("/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const issues = yield prisma.issue.findMany({
            include: {
                citizen: {
                    select: {
                        id: true,
                        name: true,
                        constituency: true,
                    },
                },
                mla: {
                    select: {
                        id: true,
                        name: true,
                        party: true,
                        constituency: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        constituency: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc', // Most recent first
            },
        });
        return res.status(200).json({
            success: true,
            count: issues.length,
            issues
        });
    }
    catch (error) {
        console.error("Error fetching issues:", error);
        console.error("Error message:", error);
        console.error("Error stack:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}));
// Enhanced GET endpoint to fetch all issues with optional filters
exports.citizenHandler.get("/issues", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, severity, category, constituency, citizenId, mlaId, organizationId, limit, offset } = req.query;
    try {
        // Build dynamic filter object
        const where = {};
        if (status) {
            where.status = status;
        }
        if (severity) {
            where.severity = severity;
        }
        if (category) {
            where.category = category;
        }
        if (citizenId) {
            where.citizenId = String(citizenId);
        }
        if (mlaId) {
            where.mlaId = String(mlaId);
        }
        if (organizationId) {
            where.organizationId = String(organizationId);
        }
        // Filter by constituency (through citizen, MLA, or organization)
        if (constituency) {
            where.OR = [
                { citizen: { constituency: String(constituency) } },
                { mla: { constituency: String(constituency) } },
                { organization: { constituency: String(constituency) } }
            ];
        }
        // Parse pagination parameters
        const limitNum = limit ? parseInt(String(limit)) : undefined;
        const offsetNum = offset ? parseInt(String(offset)) : undefined;
        // Fetch issues with filters and includes
        const [issues, totalCount] = yield Promise.all([
            prisma.issue.findMany(Object.assign(Object.assign({ where, include: {
                    citizen: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            constituency: true,
                        },
                    },
                    mla: {
                        select: {
                            id: true,
                            name: true,
                            party: true,
                            constituency: true,
                            email: true,
                            phone: true,
                            rating: true,
                        },
                    },
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            category: true,
                            constituency: true,
                            contact_email: true,
                            contact_phone: true,
                            address: true,
                        },
                    },
                }, orderBy: {
                    createdAt: 'desc',
                } }, (limitNum && { take: limitNum })), (offsetNum && { skip: offsetNum }))),
            prisma.issue.count({ where })
        ]);
        return res.status(200).json({
            success: true,
            count: issues.length,
            totalCount,
            issues: issues.map((issue) => ({
                id: issue.id,
                title: issue.title,
                description: issue.description,
                category: issue.category,
                mediaUrl: issue.mediaUrl,
                location: issue.location,
                latitude: issue.latitude,
                longitude: issue.longitude,
                status: issue.status,
                severity: issue.severity,
                citizenId: issue.citizenId,
                mlaId: issue.mlaId,
                organizationId: issue.organizationId,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                citizen: issue.citizen,
                mla: issue.mla,
                organization: issue.organization,
            })),
        });
    }
    catch (error) {
        console.error("Error fetching issues:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
}));
// Add this to your citizenHandler.ts file, after the /issues endpoint
// Get single issue by ID with full thread (comments + upvotes)
exports.citizenHandler.get("/issue/:issueId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { citizenId } = req.query; // Optional: to check if current user upvoted
    try {
        const issue = yield prisma.issue.findUnique({
            where: { id: issueId },
            include: {
                citizen: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        constituency: true,
                    },
                },
                mla: {
                    select: {
                        id: true,
                        name: true,
                        party: true,
                        constituency: true,
                        email: true,
                        phone: true,
                        rating: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        constituency: true,
                        contact_email: true,
                        contact_phone: true,
                        address: true,
                    },
                },
                comments: {
                    include: {
                        citizenAuthor: {
                            select: { id: true, name: true, email: true, constituency: true }
                        },
                        mlaAuthor: {
                            select: { id: true, name: true, party: true, constituency: true }
                        },
                        orgAuthor: {
                            select: { id: true, name: true, category: true, constituency: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                upvotes: {
                    include: {
                        citizen: {
                            select: {
                                id: true,
                                name: true,
                                constituency: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
        });
        if (!issue) {
            return res.status(404).json({
                success: false,
                message: "Issue not found"
            });
        }
        // Check if current citizen has upvoted
        let hasUpvoted = false;
        if (citizenId) {
            hasUpvoted = issue.upvotes.some(upvote => upvote.citizenId === String(citizenId));
        }
        // Format comments with author info
        const formattedComments = issue.comments.map(comment => {
            let author = null;
            if (comment.authorType === 'CITIZEN' && comment.citizenAuthor) {
                author = Object.assign(Object.assign({}, comment.citizenAuthor), { type: 'CITIZEN' });
            }
            else if (comment.authorType === 'MLA' && comment.mlaAuthor) {
                author = Object.assign(Object.assign({}, comment.mlaAuthor), { type: 'MLA' });
            }
            else if (comment.authorType === 'ORGANIZATION' && comment.orgAuthor) {
                author = Object.assign(Object.assign({}, comment.orgAuthor), { type: 'ORGANIZATION' });
            }
            return {
                id: comment.id,
                content: comment.content,
                author,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            };
        });
        // Format upvotes list
        const upvotesList = issue.upvotes.map(upvote => ({
            citizen: upvote.citizen,
            upvotedAt: upvote.createdAt
        }));
        return res.status(200).json({
            success: true,
            issue: {
                id: issue.id,
                title: issue.title,
                description: issue.description,
                category: issue.category,
                mediaUrl: issue.mediaUrl,
                location: issue.location,
                latitude: issue.latitude,
                longitude: issue.longitude,
                status: issue.status,
                severity: issue.severity,
                upvoteCount: issue.upvoteCount,
                hasUpvoted,
                citizenId: issue.citizenId,
                mlaId: issue.mlaId,
                organizationId: issue.organizationId,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                citizen: issue.citizen,
                mla: issue.mla,
                organization: issue.organization,
                comments: formattedComments,
                commentCount: formattedComments.length,
                upvotes: upvotesList,
            },
        });
    }
    catch (error) {
        console.error("Error fetching issue:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
}));
// Add these endpoints to your citizenHandler.ts file
// ==================== COMMENTS ====================
// Add a comment to an issue
exports.citizenHandler.post("/issue/:issueId/comment", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { content, authorType, authorId } = req.body;
    if (!content || !authorType || !authorId) {
        return res.status(400).json({
            success: false,
            message: "content, authorType, and authorId are required"
        });
    }
    // Validate authorType
    if (!['CITIZEN', 'MLA', 'ORGANIZATION'].includes(authorType)) {
        return res.status(400).json({
            success: false,
            message: "authorType must be CITIZEN, MLA, or ORGANIZATION"
        });
    }
    try {
        // Verify issue exists
        const issueExists = yield prisma.issue.findUnique({
            where: { id: issueId }
        });
        if (!issueExists) {
            return res.status(404).json({
                success: false,
                message: "Issue not found"
            });
        }
        // Verify author exists based on type
        if (authorType === 'CITIZEN') {
            const citizenExists = yield prisma.citizen.findUnique({
                where: { id: authorId }
            });
            if (!citizenExists) {
                return res.status(404).json({
                    success: false,
                    message: "Citizen not found"
                });
            }
        }
        else if (authorType === 'MLA') {
            const mlaExists = yield prisma.mLA.findUnique({
                where: { id: authorId }
            });
            if (!mlaExists) {
                return res.status(404).json({
                    success: false,
                    message: "MLA not found"
                });
            }
        }
        else if (authorType === 'ORGANIZATION') {
            const orgExists = yield prisma.organization.findUnique({
                where: { id: authorId }
            });
            if (!orgExists) {
                return res.status(404).json({
                    success: false,
                    message: "Organization not found"
                });
            }
        }
        // Create comment with appropriate author relation
        const commentData = {
            content,
            issueId,
            authorType,
            authorId
        };
        if (authorType === 'CITIZEN') {
            commentData.citizenAuthorId = authorId;
        }
        else if (authorType === 'MLA') {
            commentData.mlaAuthorId = authorId;
        }
        else if (authorType === 'ORGANIZATION') {
            commentData.orgAuthorId = authorId;
        }
        const comment = yield prisma.comment.create({
            data: commentData,
            include: {
                citizenAuthor: {
                    select: { id: true, name: true, email: true, constituency: true }
                },
                mlaAuthor: {
                    select: { id: true, name: true, party: true, constituency: true }
                },
                orgAuthor: {
                    select: { id: true, name: true, category: true, constituency: true }
                }
            }
        });
        // Format author info
        let author = null;
        if (comment.authorType === 'CITIZEN' && comment.citizenAuthor) {
            author = Object.assign(Object.assign({}, comment.citizenAuthor), { type: 'CITIZEN' });
        }
        else if (comment.authorType === 'MLA' && comment.mlaAuthor) {
            author = Object.assign(Object.assign({}, comment.mlaAuthor), { type: 'MLA' });
        }
        else if (comment.authorType === 'ORGANIZATION' && comment.orgAuthor) {
            author = Object.assign(Object.assign({}, comment.orgAuthor), { type: 'ORGANIZATION' });
        }
        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment: {
                id: comment.id,
                content: comment.content,
                author,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        });
    }
    catch (error) {
        console.error("Error adding comment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
}));
// Delete a comment (only the author can delete)
exports.citizenHandler.delete("/comment/:commentId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { authorType, authorId } = req.body;
    if (!authorType || !authorId) {
        return res.status(400).json({
            success: false,
            message: "authorType and authorId are required"
        });
    }
    try {
        const comment = yield prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }
        // Verify ownership
        if (comment.authorType !== authorType || comment.authorId !== authorId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own comments"
            });
        }
        yield prisma.comment.delete({
            where: { id: commentId }
        });
        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
}));
// ==================== UPVOTES ====================
// Toggle upvote (add or remove) - Citizens only
exports.citizenHandler.post("/issue/:issueId/upvote", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { citizenId } = req.body;
    if (!citizenId) {
        return res.status(400).json({
            success: false,
            message: "citizenId is required"
        });
    }
    try {
        // Verify issue exists
        const issue = yield prisma.issue.findUnique({
            where: { id: issueId }
        });
        if (!issue) {
            return res.status(404).json({
                success: false,
                message: "Issue not found"
            });
        }
        // Verify citizen exists
        const citizenExists = yield prisma.citizen.findUnique({
            where: { id: citizenId }
        });
        if (!citizenExists) {
            return res.status(404).json({
                success: false,
                message: "Citizen not found"
            });
        }
        // Check if already upvoted
        const existingUpvote = yield prisma.upvote.findUnique({
            where: {
                issueId_citizenId: {
                    issueId,
                    citizenId
                }
            }
        });
        if (existingUpvote) {
            // Remove upvote
            yield prisma.$transaction([
                prisma.upvote.delete({
                    where: { id: existingUpvote.id }
                }),
                prisma.issue.update({
                    where: { id: issueId },
                    data: { upvoteCount: { decrement: 1 } }
                })
            ]);
            const updatedIssue = yield prisma.issue.findUnique({
                where: { id: issueId },
                select: { upvoteCount: true }
            });
            return res.status(200).json({
                success: true,
                message: "Upvote removed",
                upvoted: false,
                upvoteCount: (updatedIssue === null || updatedIssue === void 0 ? void 0 : updatedIssue.upvoteCount) || 0
            });
        }
        else {
            // Add upvote
            yield prisma.$transaction([
                prisma.upvote.create({
                    data: {
                        issueId,
                        citizenId
                    }
                }),
                prisma.issue.update({
                    where: { id: issueId },
                    data: { upvoteCount: { increment: 1 } }
                })
            ]);
            const updatedIssue = yield prisma.issue.findUnique({
                where: { id: issueId },
                select: { upvoteCount: true }
            });
            return res.status(201).json({
                success: true,
                message: "Upvoted successfully",
                upvoted: true,
                upvoteCount: (updatedIssue === null || updatedIssue === void 0 ? void 0 : updatedIssue.upvoteCount) || 0
            });
        }
    }
    catch (error) {
        console.error("Error toggling upvote:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        });
    }
}));
