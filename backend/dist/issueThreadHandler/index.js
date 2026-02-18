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
exports.issueThreadHandler = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.issueThreadHandler = (0, express_1.Router)();
// ==================== COMMENTS ====================
// Get all comments for an issue
exports.issueThreadHandler.get("/issues/:issueId/comments", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    try {
        const comments = yield prisma.comment.findMany({
            where: { issueId },
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
        });
        // Format comments with author info
        const formattedComments = comments.map(comment => {
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
        return res.status(200).json({
            success: true,
            count: formattedComments.length,
            comments: formattedComments
        });
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
// Add a comment to an issue (Citizens, MLAs, and Organizations can comment)
exports.issueThreadHandler.post("/issues/:issueId/comments", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { content, authorType, authorId } = req.body;
    if (!content || !authorType || !authorId) {
        return res.status(400).json({
            message: "content, authorType, and authorId are required"
        });
    }
    // Validate authorType
    if (!['CITIZEN', 'MLA', 'ORGANIZATION'].includes(authorType)) {
        return res.status(400).json({
            message: "authorType must be CITIZEN, MLA, or ORGANIZATION"
        });
    }
    try {
        // Verify issue exists
        const issueExists = yield prisma.issue.findUnique({
            where: { id: issueId }
        });
        if (!issueExists) {
            return res.status(404).json({ message: "Issue not found" });
        }
        // Verify author exists based on type
        if (authorType === 'CITIZEN') {
            const citizenExists = yield prisma.citizen.findUnique({
                where: { id: authorId }
            });
            if (!citizenExists) {
                return res.status(404).json({ message: "Citizen not found" });
            }
        }
        else if (authorType === 'MLA') {
            const mlaExists = yield prisma.mLA.findUnique({
                where: { id: authorId }
            });
            if (!mlaExists) {
                return res.status(404).json({ message: "MLA not found" });
            }
        }
        else if (authorType === 'ORGANIZATION') {
            const orgExists = yield prisma.organization.findUnique({
                where: { id: authorId }
            });
            if (!orgExists) {
                return res.status(404).json({ message: "Organization not found" });
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
            message: "Internal server error"
        });
    }
}));
// Delete a comment (only the author can delete)
exports.issueThreadHandler.delete("/comments/:commentId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { authorType, authorId } = req.body;
    try {
        const comment = yield prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        // Verify ownership
        if (comment.authorType !== authorType || comment.authorId !== authorId) {
            return res.status(403).json({
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
            message: "Internal server error"
        });
    }
}));
// ==================== UPVOTES (Citizens Only) ====================
// Get upvote count and check if citizen has upvoted
exports.issueThreadHandler.get("/issues/:issueId/upvotes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { citizenId } = req.query;
    try {
        const upvoteCount = yield prisma.upvote.count({
            where: { issueId }
        });
        let hasUpvoted = false;
        if (citizenId) {
            const existingUpvote = yield prisma.upvote.findUnique({
                where: {
                    issueId_citizenId: {
                        issueId,
                        citizenId: String(citizenId)
                    }
                }
            });
            hasUpvoted = !!existingUpvote;
        }
        return res.status(200).json({
            success: true,
            upvoteCount,
            hasUpvoted
        });
    }
    catch (error) {
        console.error("Error fetching upvotes:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
// Toggle upvote (only citizens can upvote)
exports.issueThreadHandler.post("/issues/:issueId/upvote", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { citizenId } = req.body;
    if (!citizenId) {
        return res.status(400).json({
            message: "citizenId is required"
        });
    }
    try {
        // Verify issue exists
        const issue = yield prisma.issue.findUnique({
            where: { id: issueId }
        });
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }
        // Verify citizen exists
        const citizenExists = yield prisma.citizen.findUnique({
            where: { id: citizenId }
        });
        if (!citizenExists) {
            return res.status(404).json({ message: "Citizen not found" });
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
            message: "Internal server error"
        });
    }
}));
// Get list of citizens who upvoted an issue
exports.issueThreadHandler.get("/issues/:issueId/upvote-list", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    try {
        const upvotes = yield prisma.upvote.findMany({
            where: { issueId },
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
        });
        return res.status(200).json({
            success: true,
            count: upvotes.length,
            upvotes: upvotes.map(upvote => ({
                citizen: upvote.citizen,
                upvotedAt: upvote.createdAt
            }))
        });
    }
    catch (error) {
        console.error("Error fetching upvote list:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
// ==================== FULL THREAD ====================
// Get issue with full thread (comments + upvotes)
exports.issueThreadHandler.get("/issues/:issueId/thread", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { issueId } = req.params;
    const { citizenId } = req.query;
    try {
        const issue = yield prisma.issue.findUnique({
            where: { id: issueId },
            include: {
                citizen: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        constituency: true
                    }
                },
                mla: {
                    select: {
                        id: true,
                        name: true,
                        party: true,
                        constituency: true,
                        rating: true
                    }
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        constituency: true
                    }
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
                }
            }
        });
        if (!issue) {
            return res.status(404).json({ message: "Issue not found" });
        }
        // Check if current citizen has upvoted
        let hasUpvoted = false;
        if (citizenId) {
            const existingUpvote = yield prisma.upvote.findUnique({
                where: {
                    issueId_citizenId: {
                        issueId,
                        citizenId: String(citizenId)
                    }
                }
            });
            hasUpvoted = !!existingUpvote;
        }
        // Format comments
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
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                citizen: issue.citizen,
                mla: issue.mla,
                organization: issue.organization,
                comments: formattedComments,
                commentCount: formattedComments.length
            }
        });
    }
    catch (error) {
        console.error("Error fetching issue thread:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}));
