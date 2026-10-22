/** @type {import('next').NextConfig} */
module.exports = {
  // These packages read files / use dynamic requires, so they must not be bundled by webpack.
  experimental: { serverComponentsExternalPackages: ["mammoth", "word-extractor"] },
};
