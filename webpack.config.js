const path = require('path');
const { exec } = require('child_process');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const EventHooksPlugin = require('event-hooks-webpack-plugin');

module.exports = (env, options) => {
  const devMode = options.mode == 'development';
  return {
    entry: ['./styles/style.css'],
    output: {
      path: path.resolve(__dirname, 'static/assets/'),
      publicPath: '',
      filename: '_.js',
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'main.css',
      }),
      new EventHooksPlugin({
        done: () => {
          // remove unecessary js file
          exec(`rm -rf ${path.resolve(__dirname, 'static/assets/_.js')}`);
        },
      }),
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
        },
      ],
    },
  };
};
