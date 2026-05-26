import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl() {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    prompt: 'consent',
  })
}

export async function getCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function listUpcomingEvents(accessToken: string, refreshToken?: string, maxResults = 10) {
  const calendar = await getCalendarClient(accessToken, refreshToken)
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })
  return res.data.items ?? []
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string
    description?: string
    startDateTime: string
    endDateTime: string
    attendeeEmails?: string[]
  },
  refreshToken?: string
) {
  const calendar = await getCalendarClient(accessToken, refreshToken)
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startDateTime, timeZone: 'Europe/London' },
      end: { dateTime: event.endDateTime, timeZone: 'Europe/London' },
      attendees: event.attendeeEmails?.map(email => ({ email })),
    },
  })
  return res.data
}
