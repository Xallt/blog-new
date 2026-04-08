// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';

import rehypeKatex from 'rehype-katex';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  base: process.env.BASE_PATH || '/',

  markdown: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
      shikiConfig: {
          theme: 'github-dark',
      },
  },

  integrations: [mdx()],
});