import { useEffect } from 'react'

// SPAs serve one static <title>/<meta> pair from index.html for every
// route. Googlebot renders JS and picks up updates made here, but bots
// that don't execute JS (link-unfurlers for Slack/Twitter/etc.) only ever
// see index.html's defaults — those stay accurate for the home page as a
// fallback.

const SITE_NAME = 'SpecterUI'
const BASE_URL = 'https://specterui.dev'

interface SeoOptions {
  title: string
  description: string
  path: string
  noindex?: boolean
}

export function useSeo({ title, description, path, noindex }: SeoOptions) {
  useEffect(() => {
    const fullTitle = `${title} — ${SITE_NAME}`
    document.title = fullTitle

    setMeta('description', description)
    setMeta('robots', noindex ? 'noindex, follow' : 'index, follow')
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)

    if (!noindex) {
      const canonicalHref = `${BASE_URL}${path}`
      setCanonical(canonicalHref)
      setMeta('og:url', canonicalHref, true)
    }
  }, [title, description, path, noindex])
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}
