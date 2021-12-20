import { LogsInsights, TimeType, TimeZone, Unit } from './insights'

describe('LogsInsightBuilder', function () {
    it('Absolute time range', function () {
        const start = new Date('2021-12-19T17:32:46.528Z')
        const end = new Date(start)
        end.setHours(start.getHours() + 1)

        const q = new LogsInsights()

        q.setTimeRange({
            timeType: TimeType.ABSOLUTE,
            start,
            end,
        })
        const range = (q as any).range
        expect(range.timeType).toEqual(TimeType.ABSOLUTE)
        expect(range.start).toEqual(start)
        expect(range.end).toEqual(end)
    })

    it('Relative time range', function () {
        const start = 3600

        const q = new LogsInsights()

        q.setTimeRange({
            timeType: TimeType.RELATIVE,
            start,
            unit: Unit.Seconds,
        })
        const range = (q as any).range
        expect(range.timeType).toEqual(TimeType.RELATIVE)
        expect(range.start).toEqual(start)
        expect(range.unit).toEqual(Unit.Seconds)
    })

    test('Build URL hash', () => {
        const q = new LogsInsights({
            timeType: TimeType.ABSOLUTE,
            end: new Date('2021-12-01T23:59:59.000Z'),
            start: new Date('2021-12-01T12:34:56.000Z'),
            timeZone: TimeZone.Local,
            queryID: '96637f5b-6363-4792-a8fd-953739f786c8',
            query: `\
fields @timestamp, @message
| sort @timestamp asc
| filter @logStream LIKE /(pattern-A|pattern-B)/
| limit 200`,
            logGroups: ['group-A', 'logGroup-B'],
        })

        const encoded =
            '#logsV2:logs-insights$3FqueryDetail$3D$257E$2528end$257E$25272021-12-01T23*3A59*3A59.000Z$257Estart$257E$25272021-12-01T12*3A34*3A56.000Z$257EtimeType$257E$2527ABSOLUTE$257Etz$257E$2527Local$257EeditorString$257E$2527fields*20*40timestamp*2C*20*40message*0A*7C*20sort*20*40timestamp*20asc*0A*7C*20filter*20*40logStream*20LIKE*20*2F*28pattern-A*7Cpattern-B*29*2F*0A*7C*20limit*20200$257EisLiveTail$257Efalse$257EqueryId$257E$252796637f5b-6363-4792-a8fd-953739f786c8$257Esource$257E$2528$257E$2527group-A$257E$2527logGroup-B$2529$2529'
        expect(q.toHash().toLowerCase()).toEqual(encoded.toLowerCase())
    })
})
