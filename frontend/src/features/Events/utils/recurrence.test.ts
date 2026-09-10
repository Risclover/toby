import dayjs from "dayjs";
import {
    buildRRule,
    describeCustomRecurrenceRule,
    matchingPresetKind,
    parseRRule,
    pluralizeUnit,
    type CustomRecurrenceRule
} from "./recurrence";

process.env.TZ = "America/New_York";

const anchorDate = dayjs("2026-09-09");

describe("pluralizeUnit", () => {
    it("returns the bare word when count is exactly 1", () => {
        expect(pluralizeUnit("day", 1)).toBe("day");
    });

    it("adds an s when count is greater than 1", () => {
        expect(pluralizeUnit("day", 2)).toBe("days");
    });

    it("adds an s when count is 0", () => {
        expect(pluralizeUnit("day", 0)).toBe("days");
    });
});

describe("matchingPresetKind", () => {
    it("returns null when interval isn't 1", () => {
        const rule = { freq: "DAILY", interval: 2, end: { type: "never" } } as const;
        expect(matchingPresetKind(rule, anchorDate)).toBeNull();
    });

    it("returns null when the rule has an end condition", () => {
        const rule = { freq: "DAILY", interval: 1, end: { type: "after", occurrences: 5 } } as const;
        expect(matchingPresetKind(rule, anchorDate)).toBeNull();
    });

    it("matches DAILY to the daily preset", () => {
        const rule = { freq: "DAILY", interval: 1, end: { type: "never" } } as const;
        expect(matchingPresetKind(rule, anchorDate)).toBe("daily");
    });

    it("matches a single day equal to the anchor date's weekday to weekly", () => {
        const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, end: { type: "never" }, byDay: ["Wednesday"] };
        expect(matchingPresetKind(rule, anchorDate)).toBe("weekly");
    });

    it("matches exactly Mon-Fri to weekday", () => {
        const rule: CustomRecurrenceRule = {
            freq: "WEEKLY", interval: 1, end: { type: "never" },
            byDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        };
        expect(matchingPresetKind(rule, anchorDate)).toBe("weekday");
    });

    it("returns null for any other weekly day combination", () => {
        const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, end: { type: "never" }, byDay: ["Monday", "Wednesday"] };
        expect(matchingPresetKind(rule, anchorDate)).toBeNull();
    });

    it("matches MONTHLY nth-weekday to monthly", () => {
        const rule = { freq: "MONTHLY", interval: 1, end: { type: "never" }, mode: "nth-weekday" } as const;
        expect(matchingPresetKind(rule, anchorDate)).toBe("monthly");
    });

    it("returns null for MONTHLY day-of-month", () => {
        const rule = { freq: "MONTHLY", interval: 1, end: { type: "never" }, mode: "day-of-month" } as const;
        expect(matchingPresetKind(rule, anchorDate)).toBeNull();
    });

    it("matches YEARLY to annually", () => {
        const rule = { freq: "YEARLY", interval: 1, end: { type: "never" } } as const;
        expect(matchingPresetKind(rule, anchorDate)).toBe("annually");
    });
});

describe("describeBase, tested indirectly through describeCustomRecurrenceRule", () => {
    const firstWednesday = dayjs("2026-09-02");
    const thirdWednesday = dayjs("2026-09-16");
    const fourthWednesday = dayjs("2026-09-23");
    const fourthWednesdayNoFifth = dayjs("2026-02-25");
    const fifthWednesday = dayjs("2026-09-30");

    describe("DAILY", () => {
        // interval 1 -> "Daily"
        it("omits 'every N' phrasing for a daily rule when interval is 1", () => {
            const rule: CustomRecurrenceRule = { freq: "DAILY", interval: 1, end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Daily");
        })

        // interval: 2 -> "Every 2 days"
        it("prepends 'every N' phrasing for a daily rule when interval is greater than 1", () => {
            const rule: CustomRecurrenceRule = { freq: "DAILY", interval: 2, end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Every 2 days");
        })
    })

    describe("WEEKLY", () => {
        // interval: 1, byDay: ["Wednesday"] -> "Weekly on Wednesday"
        it("describes a weekly rule with an explicit single selected day", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, byDay: ["Wednesday"], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Weekly on Wednesday");
        })

        // interval: 2, byDay: ["Wednesday"] -> "Every 2 weeks on Wednesday"
        it("prepends 'every N' phrasing for a weekly rule when interval is greater than 1", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 2, byDay: ["Wednesday"], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Every 2 weeks on Wednesday");
        })

        // interval: 1, byDay: [] -> "Weekly on Wednesday"
        it("falls back to the anchor date's weekday when byDay is empty", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, byDay: [], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Weekly on Wednesday");
        })

        // interval: 1, byDay: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] -> "Weekly on all days"
        it("collapses to 'all days' when every weekday is selected", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, byDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Weekly on all days");
        })


        // interval: 1, byDay: [Mon, Tue, Wed, Thu, Fri] -> "Weekly on weekdays"
        it("collapses to 'weekdays' when exactly Monday through Friday are selected", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, byDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Weekly on weekdays");
        })

        // interval: 1, byDay: ["Monday", "Wednesday"] -> "Weekly on Monday, Wednesday"
        it("comma-joins a partial weekday selection in week order", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, byDay: ["Monday", "Wednesday"], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Weekly on Monday, Wednesday");
        })

        it("sorts a partial weekday selection in week order", () => {
            const rule: CustomRecurrenceRule = { freq: "WEEKLY", interval: 1, byDay: ["Wednesday", "Monday"], end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Weekly on Monday, Wednesday");
        })

    })

    describe("MONTHLY", () => {
        // interval: 1, mode: "day-of-month" -> "Monthly on day 9"
        it("describes a monthly rule in day-of-month mode using the anchor date's day number", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "day-of-month", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Monthly on day 9");
        })

        // interval: 2, mode: "day-of-month" -> "Every 2 months on day 9"
        it("prepends 'every N' phrasing for a monthly day-of-month rule when interval is greater than 1", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 2, mode: "day-of-month", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Every 2 months on day 9");
        })

        // interval: 1, mode: "nth-weekday" -> "Monthly on the second Wednesday"
        it("describes a monthly rule in nth-weekday mode using the anchor date's ordinal number", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Monthly on the second Wednesday");
        })

        // interval: 2, mode: "nth-weekday" -> "Every 2 months on the second Wednesday"
        it("prepends 'every N' phrasing for a monthly nth-weekday rule when interval is greater than 1", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 2, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Every 2 months on the second Wednesday");
        })

        it("labels a weekday's first occurrence as 'first'", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, firstWednesday)).toBe("Monthly on the first Wednesday");

        })

        it("labels a weekday's third occurrence as 'third'", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, thirdWednesday)).toBe("Monthly on the third Wednesday");
        })

        it("labels a weekday's fourth occurrence as 'fourth' when a fifth occurrence still exists", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, fourthWednesday)).toBe("Monthly on the fourth Wednesday");
        })

        it("labels a weekday's fourth occurrence as 'last' when no fifth occurrence exists that month", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, fourthWednesdayNoFifth)).toBe("Monthly on the last Wednesday");
        })

        it("labels a weekday's fifth occurrence as 'last' rather than 'fifth'", () => {
            const rule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 1, mode: "nth-weekday", end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, fifthWednesday)).toBe("Monthly on the last Wednesday");
        })


    })

    describe("YEARLY", () => {
        // interval: 1 -> "Annually on September 09"
        it("describes a yearly rule using the anchor date's month and day", () => {
            const rule: CustomRecurrenceRule = { freq: "YEARLY", interval: 1, end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Annually on September 09");
        })

        // interval: 2 -> "Every 2 years on September 09"
        it("prepends 'every N' phrasing for a yearly rule when interval is greater than 1", () => {
            const rule: CustomRecurrenceRule = { freq: "YEARLY", interval: 2, end: { type: "never" } };
            expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Every 2 years on September 09");
        })
    })
})

describe("describeEnd, tested indirectly through describeCustomRecurrenceRule", () => {
    it("appends nothing when end is never", () => {
        const rule = { freq: "DAILY", interval: 1, end: { type: "never" } } as const;
        expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Daily");
    });

    it("appends 'until' when end is 'on'", () => {
        const rule = { freq: "DAILY", interval: 1, end: { type: "on", date: "2026-09-18" } } as const;
        expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Daily, until Sep 18, 2026");
    })

    it("appends the singular 'time' when end is 'after' with 1 occurrence", () => {
        const rule = { freq: "DAILY", interval: 1, end: { type: "after", occurrences: 1 } } as const;
        expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Daily, 1 time");
    })

    it("appends the plural 'times' when end is 'after' with more than 1 occurrence", () => {
        const rule = { freq: "DAILY", interval: 1, end: { type: "after", occurrences: 5 } } as const;
        expect(describeCustomRecurrenceRule(rule, anchorDate)).toBe("Daily, 5 times");
    })
});

describe("presetToRRuleString, tested indirectly through buildRRule", () => {
    it("returns null for none", () => {
        const kind = "none";

        expect(buildRRule(kind, null, anchorDate, false)).toBeNull();
    })

    it("returns 'FREQ=DAILY' for daily", () => {
        const kind = "daily";

        expect(buildRRule(kind, null, anchorDate, false)).toBe("FREQ=DAILY")
    })


    it("derives BYDAY from the anchor date's weekday for the weekly preset", () => {
        const kind = "weekly";

        expect(buildRRule(kind, null, anchorDate, false)).toBe("FREQ=WEEKLY;BYDAY=WE");
    })


    it("derives the BYDAY ordinal code from the anchor date for the monthly preset", () => {
        const kind = "monthly";

        expect(buildRRule(kind, null, anchorDate, false)).toBe("FREQ=MONTHLY;BYDAY=2WE")
    })

    it("returns 'FREQ=YEARLY' for the annually preset", () => {
        const kind = "annually";
        expect(buildRRule(kind, null, anchorDate, false)).toBe("FREQ=YEARLY");
    })

    it("returns the fixed Monday-through-Friday BYDAY list for the weekday preset", () => {
        const kind = "weekday";
        expect(buildRRule(kind, null, anchorDate, false)).toBe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")
    })


    it("returns null for an unconfigured custom selection", () => {
        const kind = "custom";

        expect(buildRRule(kind, null, anchorDate, false)).toBeNull();
    })
})

describe("parseRRule", () => {
    it("returns 'none' with no custom rule when no rrule string is given", () => {
        const rruleStr = null;
        expect(parseRRule(rruleStr, anchorDate)).toEqual({ repeatKind: "none", customRule: null });
    })

    it("falls back to 'none' when FREQ is missing or unrecognized", () => {
        const rruleStr = "FREQ=";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({ repeatKind: "none", customRule: null });
    })

    it("defaults interval to 1 when INTERVAL is absent from the rrule string", () => {
        const rruleStr = "FREQ=DAILY";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "daily", customRule: { freq: "DAILY", interval: 1, end: { type: "never" } }
        });
    })

    it("parses INTERVAL into the numeric interval field", () => {
        const rruleStr = "FREQ=DAILY;INTERVAL=2";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: { freq: "DAILY", interval: 2, end: { type: "never" } },
        });
    });

    it("parses COUNT into an 'after' end with the correct occurrence count", () => {
        const rruleStr = "FREQ=DAILY;COUNT=2";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: { freq: "DAILY", interval: 1, end: { type: "after", occurrences: 2 } },
        });
    })

    it("parses UNTIL into an 'on' end via fromIcsUntil", () => {
        const rruleStr = "FREQ=DAILY;UNTIL=20261018";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: { freq: "DAILY", interval: 1, end: { type: "on", date: "2026-10-18" } }
        })
    })

    it("parses BYDAY into weekday names, sorted into week order, for a weekly rule", () => {
        const rruleStr = "FREQ=WEEKLY;BYDAY=WE,MO";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: { freq: "WEEKLY", interval: 1, end: { type: "never" }, byDay: ["Monday", "Wednesday"] }
        })
    })

    it("defaults byDay to an empty array when BYDAY is absent from a weekly rule", () => {
        const rruleStr = "FREQ=WEEKLY";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: { freq: "WEEKLY", interval: 1, end: { type: "never" }, byDay: [] }
        })
    })

    it("sets monthly mode to 'day-of-month' when BYMONTHDAY is present", () => {
        const rruleStr = "FREQ=MONTHLY;BYMONTHDAY=9";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: { freq: "MONTHLY", interval: 1, end: { type: "never" }, mode: "day-of-month" }
        })
    })

    it("sets monthly mode to 'nth-weekday' when BYMONTHDAY is absent", () => {
        const rruleStr = "FREQ=MONTHLY";

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "monthly",
            customRule: { freq: "MONTHLY", interval: 1, end: { type: "never" }, mode: "nth-weekday" }
        })
    })

    it("reconstructs an equivalent rule after round-tripping through buildRRule and parseRRule", () => {
        const kind = "custom";
        const customRule: CustomRecurrenceRule = { freq: "MONTHLY", interval: 2, end: { type: "after", occurrences: 5 }, mode: "day-of-month" };

        const rruleStr = buildRRule(kind, customRule, anchorDate, false);

        expect(parseRRule(rruleStr, anchorDate)).toEqual({
            repeatKind: "custom",
            customRule: customRule
        });
    });
})

describe("toIcsUntilDate / toIcsUntilUtc, tested indirectly through buildRRule", () => {
    it("strips dashes from the end date when the event has no time", () => {
        const customRule: CustomRecurrenceRule = { freq: "DAILY", interval: 1, end: { type: "on", date: "2026-10-18" } };
        const rruleStr = buildRRule("custom", customRule, anchorDate, false);
        expect(rruleStr).toBe("FREQ=DAILY;UNTIL=20261018");
    })

    it("converts an 'on' end date to a UTC UNTIL timestamp using standard time (winter, EST, UTC-5)", () => {
        const customRule: CustomRecurrenceRule = { freq: "DAILY", interval: 1, end: { type: "on", date: "2026-01-15" } };
        const rruleStr = buildRRule("custom", customRule, anchorDate, true);
        expect(rruleStr).toBe("FREQ=DAILY;UNTIL=20260116T045959Z");
    })

    it("converts an 'on' end date to a UTC UNTIL timestamp using daylight time (summer, EDT, UTC-4)", () => {
        const customRule: CustomRecurrenceRule = { freq: "DAILY", interval: 1, end: { type: "on", date: "2026-07-15" } };
        const rruleStr = buildRRule("custom", customRule, anchorDate, true);
        expect(rruleStr).toBe("FREQ=DAILY;UNTIL=20260716T035959Z");
    })
})