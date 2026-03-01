import { http, HttpResponse } from 'msw';

const fakeAnnouncement = {
    id: 1,
    userId: 2,
    householdId: 1,
    message: "Demo",
    isImportant: false,
    seenByCurrent: false,
    creator: {
        id: 2,
        firstName: "John",
        profileImg: ""
    },
}

const unseenAnnouncementsResponse = {
    items: [fakeAnnouncement],
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    totalCount: 1
}

const seenAnnouncement = {
    ...fakeAnnouncement,
    seenByCurrent: true
}

const seenAnnouncementsResponse = {
    items: [seenAnnouncement],
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    totalCount: 1
}

export const announcementHandlers = {
    unseen: http.get('http://localhost:5000/api/households/:householdId/announcements', () => {
        return HttpResponse.json(unseenAnnouncementsResponse)
    }),
    seen: http.get('http://localhost:5000/api/households/:householdId/announcements', () => {
        return HttpResponse.json(seenAnnouncementsResponse)
    })
}

const fakeUser = {
    id: 1,
    firstName: "Sara",
    lastName: "Dunlop",
    email: "sara@aa.io",
    createdAt: "2026-01-01",
    displayName: "Sara",
    tagline: null,
    profileImg: null,
    bannerImg: null,
    points: 0,
    dailyCheckin: false,
    lastCheckin: null,
    timezone: "UTC",
    householdId: 1,
    reminders: []
}

export const authHandlers = {
    authenticated: http.get('http://localhost:5000/api/auth', () => {
        return HttpResponse.json(fakeUser)
    }),
    unauthenticated: http.get('http://localhost:5000/api/auth', () => {
        return HttpResponse.json(null, { status: 401 })
    })
}