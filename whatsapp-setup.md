# WhatsApp Integration Setup Guide

## Overview
CIVICOS WhatsApp Bot allows citizens to report civic issues directly through WhatsApp, making civic engagement more accessible.

## Features
- 📝 Text-based issue reporting
- 📍 Location sharing (GPS pins and text addresses)
- 📸 Image attachments for evidence
- 🎤 Voice message support (coming soon)
- 📊 Real-time status tracking
- 🌐 Multi-language support (coming soon)

## Setup Instructions

### 1. WhatsApp Business API Setup

1. **Create Meta Business Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a Meta Business Account
   - Verify your business

2. **Get WhatsApp Business API Access**
   - Apply for WhatsApp Business API access
   - Select "Embedded Signup" for easier integration
   - Choose your phone number

3. **Create WhatsApp App**
   - In Meta for Developers, create new app
   - Select "Business" type
   - Add "WhatsApp" product
   - Configure webhook settings

### 2. Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# WhatsApp Webhook URL
# Set this in your WhatsApp app configuration:
# https://your-domain.com/api/whatsapp/webhook
```

### 3. Database Migration

Run the database migration to add WhatsApp support:

```bash
npx prisma migrate dev --name add-whatsapp-support
npx prisma generate
```

### 4. Webhook Configuration

1. **Set Webhook URL** in WhatsApp Business settings:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```

2. **Verify Webhook** - The system will automatically handle verification

3. **Subscribe to Messages** field:
   - `messages`
   - `message_reactions`

### 5. Testing the Bot

Send a WhatsApp message to your business number with:

- **"help"** - Show available commands
- **"menu"** - Start reporting an issue
- **"status"** - Check your reports

## User Commands

### Basic Commands
- `help` - Show help menu
- `menu` or `report` - Start new report
- `status` - Check your reports
- `cancel` - Cancel current operation

### Reporting Categories
Users can report these issues:
- POTHOLES
- GARBAGE  
- WATER_LEAKAGE
- DRAINAGE_SEWAGE
- STREETLIGHT
- ROAD_DAMAGE
- ILLEGAL_DUMPING
- STRAY_ANIMALS
- TRAFFIC_SIGNAL
- ENCROACHMENT
- BUILDING
- FLOODING
- OTHER

### Report Examples
```
POTHOLES Large pothole on Main Street near bus stop
GARBAGE Overflowing garbage bin at Park Road
WATER_LEAKAGE Water leaking from municipal pipe
```

## Message Flow

1. **User sends category + description**
2. **Bot requests location** (GPS pin or address)
3. **User shares location**
4. **Bot asks for confirmation**
5. **User confirms** → Report created
6. **Bot sends confirmation with report ID**

## Advanced Features

### Location Types Supported
- 📍 WhatsApp location pins (GPS coordinates)
- 📍 Text addresses/landmarks
- 📍 Area names/colony names

### Image Support
- 📸 Photo attachments
- 📸 Multiple images per report
- 📸 Automatic image processing

### Status Updates
- 📊 Real-time status tracking
- 📊 Timeline updates
- 📊 Assignment notifications

## Monitoring & Analytics

### Key Metrics to Track
- Reports via WhatsApp vs web
- Response times
- Resolution rates
- User engagement

### Dashboard Integration
All WhatsApp reports appear in the main CIVICOS dashboard alongside web reports.

## Security Considerations

1. **Webhook Verification** - Automatic signature verification
2. **Phone Number Privacy** - Numbers stored securely
3. **Message Encryption** - WhatsApp end-to-end encryption
4. **Rate Limiting** - Prevent spam/abuse

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check webhook URL is accessible
   - Verify webhook is subscribed to messages
   - Check SSL certificate

2. **Messages not being parsed**
   - Check message format
   - Verify category spelling
   - Check for special characters

3. **Location not working**
   - Ensure user has location permissions
   - Check GPS coordinates format
   - Verify address parsing

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=whatsapp:*
```

## Scaling Considerations

### Performance
- Use Redis for session caching
- Implement message queuing
- Add CDN for media files

### Reliability
- Multiple webhook endpoints
- Database replication
- Backup phone numbers

## Future Enhancements

### Phase 2 Features
- 🎤 Voice-to-text conversion
- 🌐 Regional language support
- 🤖 AI-powered categorization
- 📱 Interactive buttons

### Phase 3 Features
- 📊 Predictive analytics
- 🤝 Community verification
- 🏆 Gamification elements
- 📈 Advanced reporting

## Support

For issues:
1. Check logs: `logs/whatsapp.log`
2. Verify environment variables
3. Test webhook endpoint
4. Check WhatsApp Business API status

## API Documentation

### Webhook Endpoint
```
POST /api/whatsapp/webhook
GET /api/whatsapp/webhook (for verification)
```

### Message Format
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "from": "1234567890",
          "id": "msg_id",
          "timestamp": "1234567890",
          "type": "text",
          "text": {"body": "POTHOLES Main Street"}
        }]
      }
    }]
  }]
}
```

This WhatsApp integration makes CIVICOS accessible to millions of WhatsApp users, dramatically expanding your civic engagement reach! 🚀
