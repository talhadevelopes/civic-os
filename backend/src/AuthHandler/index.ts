import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
export const authHandler = Router();

// Health check
authHandler.get("/health", (req, res) => {
  return res.status(200).json({ message: "Auth route up and running" });
});


authHandler.post("/signUp", async (req, res) => {
  try {
    const { name, email, password, constituency } = req.body; 

    if (!name || !email || !password || !constituency) {
      return res.status(400).json({ error: "All fields (name, email, password, constituency) are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const isMLA = email.endsWith("@mla.com");
    const isOrg = email.endsWith("@org.com");

    if (isMLA) {
      const existing = await prisma.mLA.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: "MLA already exists" });

      const newMLA = await prisma.mLA.create({
        data: { name, email, constituency }, 
      });

      return res.status(201).json({
        message: "MLA registered successfully",
        userType: "MLA",
        data: newMLA,
      });
    }

    if (isOrg) {
      const existing = await prisma.organization.findUnique({
        where: { contact_email: email },
      });
      if (existing)
        return res.status(409).json({ error: "Organization already exists" });

      const newOrg = await prisma.organization.create({
        data: { name, category: "General", contact_email: email, constituency }, // Store constituency
      });

      return res.status(201).json({
        message: "Organization registered successfully",
        userType: "Organization",
        data: newOrg,
      });
    }

    // Default → Citizen
    const existingCitizen = await prisma.citizen.findUnique({ where: { email } });
    if (existingCitizen)
      return res.status(409).json({ error: "Citizen already exists" });

    // Link MLAs and Organizations during signup
    const mlas = await prisma.mLA.findMany({ where: { constituency } });
    const orgs = await prisma.organization.findMany({ where: { constituency } });

    const newCitizen = await prisma.citizen.create({
      data: {
        name,
        email,
        password: hashedPassword,
        constituency, // STORE constituency
        linked_MLAs: { connect: mlas.map((mla) => ({ id: mla.id })) },
        linked_Organizations: { connect: orgs.map((org) => ({ id: org.id })) },
      },
      select: {
        id: true,
        name: true,
        email: true,
        constituency: true,
        linked_MLAs: { select: { name: true } },
        linked_Organizations: { select: { name: true } },
      },
    });

    return res.status(201).json({
      message: "Citizen registered successfully",
      userType: "Citizen",
      data: newCitizen,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


const JWT_SECRET = process.env.JWT_SECRET;

authHandler.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Determine user type based on email domain
    const isMLA = email.endsWith("@mla.com");
    const isAuthority = email.endsWith("@authority.com");
    const isCitizen = !isMLA && !isAuthority;

    // MLA Login
    if (isMLA) {
      const mla = await prisma.mLA.findUnique({
        where: { email },
        include: {
          citizens: true,
          issues: true,
        },
      });

      if (!mla) {
        return res.status(404).json({ message: "MLA not found" });
      }

      // MLAs don't have passwords in your schema, so you might want to add that
      // For now, we'll just authenticate based on email existence
      
      const token = jwt.sign(
        {
          userId: mla.id,
          email: mla.email,
          role: "mla",
        },
        JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "MLA login successful",
        token,
        role: "mla",
        user: {
          id: mla.id,
          name: mla.name,
          email: mla.email,
          constituency: mla.constituency,
          party: mla.party,
          phone: mla.phone,
          rating: mla.rating,
          totalComplaints: mla.totalComplaints,
          resolvedComplaints: mla.resolvedComplaints,
        },
      });
    }

    // Authority/Organization Login
    if (isAuthority) {
      const organization = await prisma.organization.findUnique({
        where: { contact_email: email },
        include: {
          citizens: true,
          issues: true,
        },
      });

      if (!organization) {
        return res.status(404).json({ message: "Authority not found" });
      }

      const token = jwt.sign(
        {
          userId: organization.id,
          email: organization.contact_email,
          role: "authority",
        },
        JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Authority login successful",
        token,
        role: "authority",
        user: {
          id: organization.id,
          name: organization.name,
          email: organization.contact_email,
          constituency: organization.constituency,
          category: organization.category,
          phone: organization.contact_phone,
          address: organization.address,
          totalComplaints: organization.totalComplaints,
          resolvedComplaints: organization.resolvedComplaints,
        },
      });
    }

    // Citizen Login
    if (isCitizen) {
      const citizen = await prisma.citizen.findUnique({
        where: { email },
        include: {
          linked_MLAs: true,
          linked_Organizations: true,
        },
      });

      if (!citizen) {
        return res.status(404).json({ message: "Citizen not found" });
      }

      const valid = await bcrypt.compare(password, citizen.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        {
          userId: citizen.id,
          email: citizen.email,
          role: "citizen",
        },
        JWT_SECRET!,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        role: "citizen",
        citizen: {
          id: citizen.id,
          name: citizen.name,
          email: citizen.email,
          constituency: citizen.constituency,
          linked_MLAs: citizen.linked_MLAs.map((m) => ({
            id: m.id,
            name: m.name,
            party: m.party,
          })),
          linked_Organizations: citizen.linked_Organizations.map((o) => ({
            id: o.id,
            name: o.name,
            category: o.category,
          })),
        },
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

