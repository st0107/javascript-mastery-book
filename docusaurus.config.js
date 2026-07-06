// @ts-check

const config = {
  title: 'JavaScript Mastery for FAANG Interviews',
  tagline: 'Master JavaScript deeply enough to explain it under pressure.',
  favicon: 'assets/favicon.ico',
  url: 'https://example.com',
  baseUrl: '/',
  organizationName: 'sumit',
  projectName: 'javascript-mastery-book',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true
        },
        blog: false,
        debug: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      }
    ]
  ],
  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
        language: ['en']
      }
    ]
  ],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    }
  },
  themes: ['@docusaurus/theme-mermaid'],
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true
    },
    navbar: {
      title: 'JavaScript Mastery',
      items: [
        { to: '/', label: 'Book', position: 'left' },
        { to: '/table-of-contents', label: 'Contents', position: 'left' },
        { href: 'https://github.com/', label: 'GitHub', position: 'right' }
      ]
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true
      }
    },
    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
      additionalLanguages: ['bash', 'json']
    }
  }
};

module.exports = config;
