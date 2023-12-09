module.exports = {
  reactStrictMode: true,
  transpilePackages: ["ui"],

  reactStrictMode: false,

  webpack: (config) => {
    config.module.rules = [
      {
        resourceQuery: /raw/,
        type: "asset/source",
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ["raw-loader", "glslify-loader"],
      },
      ...config.module.rules,
    ];

    return config;
  },
};
