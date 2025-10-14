const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // 禁用所有 source map
      webpackConfig.devtool = false;
      
      // 在开发模式下也启用代码压缩和混淆
      if (env === 'development') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                  drop_console: false, // 如果想去掉console.log，改为true
                  drop_debugger: true,
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
            }),
          ],
        };
      }

      // 移除 source map 相关插件
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'SourceMapDevToolPlugin'
      );

      return webpackConfig;
    },
  },
  
  devServer: {
    // 开发服务器配置
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
};

