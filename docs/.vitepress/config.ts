import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Sagana Web',
  description: 'Technical Documentation for Sagana Web Platform',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#718619' }],
  ],

  themeConfig: {
    siteTitle: 'Sagana Web',
    logo: undefined,

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Core Systems', link: '/core/authentication' },
      { text: 'Reference', link: '/reference/env-vars' },
    ],

    sidebar: [
      {
        text: 'Overview & Setup',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Architecture & Conventions', link: '/guide/architecture' },
          { text: 'Routing & Navigation', link: '/guide/routing-navigation' },
        ],
      },
      {
        text: 'Core Engineering',
        items: [
          { text: 'Authentication & Roles', link: '/core/authentication' },
          { text: 'Design System & Tokens', link: '/core/design-system' },
          { text: 'Typed API Client', link: '/core/api-client' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Environment Variables Schema', link: '/reference/env-vars' },
          { text: 'Troubleshooting & FAQ', link: '/reference/troubleshooting' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/likha-innovations/sagana-web' },
    ],

    footer: {
      message: 'Sagana Web Client: Built for Likha Innovations',
      copyright: 'Copyright 2026 Likha Innovations. All rights reserved.',
    },
  },
})
