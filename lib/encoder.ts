export function fixedEncodeURIComponent(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
        return '%' + c.charCodeAt(0).toString(16)
    })
}

export function encodeCloudWatchQuery(q: unknown): string {
    if (Array.isArray(q)) {
        return '(' + q.map((s) => `~${encodeCloudWatchQuery(s)}`).join('') + ')'
    }
    const t = typeof q
    switch (t) {
        case 'string':
            return "'" + fixedEncodeURIComponent(q as string).replace(/%/g, '*')
        case 'number':
            return (q as number).toString()
        case 'boolean':
            return (q as boolean).toString()
        case 'object':
            return (
                '~(' +
                Object.entries(q as { [_: string]: unknown })
                    .map(([k, v]) => {
                        return `${k}~` + encodeCloudWatchQuery(v)
                    })
                    .join('~') +
                ')'
            )
        default:
            throw `unsupported type of ${t}`
    }
}
