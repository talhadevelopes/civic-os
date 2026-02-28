import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function getUserByWhatsApp(phone: string) {
  return await prisma.user.findFirst({
    where: {
      phone: phone.replace(/[^\d]/g, '') // Remove non-digits
    }
  });
}

export async function createUserFromWhatsApp(phone: string, name?: string) {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Generate a random password for WhatsApp users
  const randomPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(randomPassword, 10);
  
  // Generate a unique email based on phone number
  const email = `whatsapp_${cleanPhone}@civicos.user`;
  
  return await prisma.user.create({
    data: {
      name: name || `WhatsApp User ${cleanPhone.slice(-4)}`,
      email,
      passwordHash,
      phone: cleanPhone,
      role: 'CITIZEN'
    }
  });
}

export async function linkWhatsAppToUser(userId: string, phone: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      phone: phone.replace(/[^\d]/g, '')
    }
  });
}

export async function getUserSession(userId: string) {
  return await prisma.whatsappSession.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true
        }
      }
    }
  });
}

export async function clearUserSession(userId: string) {
  return await prisma.whatsappSession.delete({
    where: { userId }
  });
}
