declare module 'virtual:verb-data' {
  const urls: Record<string, string>
  export default urls
}

declare module 'virtual:book-library' {
  export const indexUrl: string
  export const entryUrls: Record<number, string>
}
