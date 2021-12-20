import { Builder } from './builder'
import { v4 as uuidv4 } from 'uuid'
import { encodeCloudWatchQuery } from './encoder'

export const TimeType = {
    ABSOLUTE: 'ABSOLUTE',
    RELATIVE: 'RELATIVE',
} as const

export type TimeType = typeof TimeType[keyof typeof TimeType]

export const TimeZone = {
    Local: 'Local',
    UTC: 'UTC',
}

export type TimeZone = typeof TimeZone[keyof typeof TimeZone]

export const Unit = {
    Seconds: 'seconds',
}
export type Unit = typeof Unit[keyof typeof Unit]

export type TimeRange =
    | {
          timeType: typeof TimeType.ABSOLUTE
          start: Date
          end: Date
      }
    | {
          timeType: typeof TimeType.RELATIVE
          start: number
          unit: typeof Unit.Seconds
      }

export type LogsInsightsParams = {
    isLiveTail?: boolean
    timeZone?: TimeZone
    queryID?: string
    query?: string
    logGroups?: string[]
} & TimeRange

export class LogsInsights implements Builder {
    private range: TimeRange
    private isLiveTail: boolean
    private timeZone: TimeZone
    private editorString: string
    readonly queryID: string
    readonly logGroups: string[]

    constructor(params?: LogsInsightsParams) {
        // UI defaults
        this.range = {
            timeType: TimeType.RELATIVE,
            start: 3600,
            unit: Unit.Seconds,
        }
        this.isLiveTail = false
        this.timeZone = TimeZone.UTC
        this.editorString = `\
        fields @timestamp, @message
        | sort @timestamp desc
        | limit 20`.trim()
        this.logGroups = []
        this.queryID = uuidv4()

        if (params) {
            if (params.timeType) {
                this.setTimeRange(params)
            }
            if (params.timeZone) {
                this.timeZone = params.timeZone
            }
            if (params.isLiveTail != null) {
                this.isLiveTail = params.isLiveTail
            }
            if (params.queryID != null) {
                this.queryID = params.queryID
            }
            if (params.query) {
                this.setQuery(params.query)
            }
            if (params.logGroups) {
                this.addLogGroups(...params.logGroups)
            }
        }
    }

    setTimeRange(range: TimeRange) {
        switch (range.timeType) {
            case TimeType.RELATIVE:
                this.range = {
                    timeType: range.timeType,
                    start: range.start,
                    unit: range.unit,
                }
                break
            case TimeType.ABSOLUTE:
                this.range = {
                    timeType: range.timeType,
                    start: range.start,
                    end: range.end,
                }
                break
        }
    }

    addLogGroups(...group: string[]) {
        this.logGroups.push(...group)
    }

    setQuery(query: string) {
        this.editorString = query
    }

    setTimeZone(tz: TimeZone) {
        this.timeZone = tz
    }

    setLiveTail(flag: boolean) {
        this.isLiveTail = flag
    }

    toHash(): string {
        type CWLogQuery = {
            timeType: TimeType
            isLiveTail: boolean
            queryId: string
            end: string | number
            start: string | number
            unit?: Unit
            tz: TimeZone
            editorString: string
            source: string[]
        }
        const query: CWLogQuery = {
            end: 0,
            start: 0,
            timeType: this.range.timeType,
            tz: this.timeZone,
            editorString: this.editorString,
            isLiveTail: this.isLiveTail,
            queryId: this.queryID,
            source: this.logGroups,
        }

        switch (this.range.timeType) {
            case TimeType.RELATIVE:
                query.start = this.range.start
                query.end = 0
                query.unit = this.range.unit
                break
            case TimeType.ABSOLUTE:
                query.start = this.range.start.toISOString()
                query.end = this.range.end.toISOString()
                break
        }
        const s = encodeCloudWatchQuery(query)
        return (
            '#logsV2:logs-insights' +
            encodeURIComponent('?queryDetail=' + escape(s)).replace(/%/g, '$')
        )
    }

    toURLString(region: string): string {
        return (
            `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}` +
            this.toHash()
        )
    }
}
