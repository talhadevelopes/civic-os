import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from './sender';
import { clearUserSession } from './userService';

export async function createReportFromWhatsApp(userId: string, reportData: any) {
  try {
    // Find ward based on location if coordinates available
    let ward = null;
    if (reportData.location?.latitude && reportData.location?.longitude) {
      ward = await findWardByCoordinates(
        reportData.location.latitude,
        reportData.location.longitude
      );
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        title: `${reportData.category} reported via WhatsApp`,
        description: reportData.description || 'Reported via WhatsApp',
        category: reportData.category,
        status: 'REPORTED',
        areaName: reportData.location?.address || 'WhatsApp Report',
        latitude: reportData.location?.latitude,
        longitude: reportData.location?.longitude,
        locationText: reportData.location?.address,
        wardId: ward?.id,
        createdById: userId,
        citizenPhotoUrl: reportData.images?.[0]?.url,
        images: reportData.images ? {
          create: reportData.images.map((img: any, index: number) => ({
            isMain: index === 0,
            mimeType: img.mimeType,
            base64Data: img.url // Store URL for now, can be converted to base64 later
          }))
        } : undefined
      },
      include: {
        ward: { select: { name: true } },
        createdBy: { select: { name: true, phone: true } }
      }
    });

    // Create timeline entry
    await prisma.issueTimeline.create({
      data: {
        issueId: report.id,
        actorId: userId,
        actorName: report.createdBy.name,
        actorRole: 'CITIZEN',
        action: 'REPORTED',
        note: 'Issue reported via WhatsApp'
      }
    });

    // Auto-assign to authority if ward is found
    if (ward) {
      await assignReportToAuthority(report.id, ward.id);
    }

    // Send confirmation message
    await sendReportConfirmation(report.createdBy.phone, report);

    // Clear session
    await clearUserSession(userId);

    return report;
  } catch (error) {
    console.error('Error creating WhatsApp report:', error);
    throw error;
  }
}

async function findWardByCoordinates(latitude: number, longitude: number) {
  // This would use geospatial queries to find the ward containing these coordinates
  // For now, we'll use a simple approach or return null
  
  // In a real implementation, you would use PostGIS or similar:
  // SELECT * FROM wards WHERE ST_Contains(geojsonBoundary, ST_Point(longitude, latitude));
  
  // For demo purposes, return first ward or null
  return await prisma.ward.findFirst();
}

async function assignReportToAuthority(reportId: string, wardId: string) {
  // Find MLA for this ward
  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
    include: { mla: true }
  });

  if (ward?.mla) {
    // Assign to MLA
    await prisma.report.update({
      where: { id: reportId },
      data: {
        assignedMlaId: ward.mla.id,
        mlaName: ward.mla.name,
        constituencyName: ward.mla.constituency
      }
    });

    // Create timeline entry
    await prisma.issueTimeline.create({
      data: {
        issueId: reportId,
        actorName: 'System',
        actorRole: 'SYSTEM',
        action: 'ASSIGNED',
        note: `Assigned to MLA ${ward.mla.name}`
      }
    });
  }

  // Find relevant authority based on category
  const authority = await findRelevantAuthority(reportId);
  
  if (authority) {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        assignedAuthorityId: authority.id
      }
    });

    // Create timeline entry
    await prisma.issueTimeline.create({
      data: {
        issueId: reportId,
        actorId: authority.id,
        actorName: authority.name,
        actorRole: 'AUTHORITY',
        action: 'ASSIGNED',
        note: 'Assigned to relevant authority'
      }
    });
  }
}

async function findRelevantAuthority(reportId: string) {
  // This would find the appropriate authority based on category and location
  // For now, return first authority user
  return await prisma.user.findFirst({
    where: { role: 'AUTHORITY' }
  });
}

async function sendReportConfirmation(phone: string, report: any) {
  const message = `✅ Report Submitted Successfully!\n\n` +
    `📋 Report ID: ${report.id.slice(-8).toUpperCase()}\n` +
    `📝 Category: ${report.category.replace(/_/g, ' ')}\n` +
    `📍 Area: ${report.areaName}\n` +
    `📊 Status: ${report.status.replace(/_/g, ' ')}\n\n` +
    `📅 Submitted: ${new Date(report.createdAt).toLocaleString()}\n\n` +
    `🔍 Track updates: Reply "status" anytime\n` +
    `📞 Need help? Reply "help"\n\n` +
    `Thank you for making our city better! 🌟`;

  await sendWhatsAppMessage(phone, {
    type: 'text',
    text: { body: message }
  });
}

export async function sendStatusUpdate(phone: string, report: any) {
  const statusEmoji = getStatusEmoji(report.status);
  const message = `📊 Report Status Update\n\n` +
    `🆔 ID: ${report.id.slice(-8).toUpperCase()}\n` +
    `${statusEmoji} Status: ${report.status.replace(/_/g, ' ')}\n` +
    `📝 Category: ${report.category.replace(/_/g, ' ')}\n` +
    `📍 Area: ${report.areaName}\n\n` +
    `📅 Last Updated: ${new Date(report.updatedAt).toLocaleString()}\n\n` +
    `📋 Recent Activity:`;

  // Get recent timeline entries
  const timeline = await prisma.issueTimeline.findMany({
    where: { issueId: report.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      actor: {
        select: { name: true }
      }
    }
  });

  timeline.forEach(entry => {
    const actionEmoji = getActionEmoji(entry.action);
    message += `\n${actionEmoji} ${entry.action.replace(/_/g, ' ')} - ${entry.note || ''}`;
  });

  await sendWhatsAppMessage(phone, {
    type: 'text',
    text: { body: message }
  });
}

function getStatusEmoji(status: string): string {
  const statusEmojis: Record<string, string> = {
    'REPORTED': '📝',
    'ASSIGNED': '👤',
    'IN_PROGRESS': '🔧',
    'RESOLVED_PENDING_VERIFICATION': '✅',
    'CONFIRMED_FIXED': '🎉',
    'REOPENED': '🔄',
    'REJECTED': '❌'
  };
  return statusEmojis[status] || '📋';
}

function getActionEmoji(action: string): string {
  const actionEmojis: Record<string, string> = {
    'REPORTED': '📝',
    'ASSIGNED': '👤',
    'STATUS_CHANGED': '🔄',
    'COMMENT_ADDED': '💬',
    'FIX_PHOTO_UPLOADED': '📸',
    'CITIZEN_VERIFIED': '✅',
    'CITIZEN_REOPENED': '🔄',
    'REJECTED': '❌',
    'ESCALATED': '⬆️'
  };
  return actionEmojis[action] || '📋';
}
