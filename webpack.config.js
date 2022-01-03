const path = require('path');

module.exports = {
  entry: './static/assets/entry.js',
  output: {
    path: path.resolve(__dirname, 'static/assets/'),
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
    ],
  },
};
